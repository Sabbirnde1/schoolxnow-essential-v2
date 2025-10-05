// Realtime subscription management utilities
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

/**
 * Subscription manager to handle realtime connections
 */
class SubscriptionManager {
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private subscriptionStatus: Map<string, string> = new Map();

  /**
   * Subscribe to table changes
   */
  subscribe<T extends TableName>(
    channelName: string,
    table: T,
    options: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      filter?: string;
      schema?: string;
      onInsert?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void;
      onUpdate?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void;
      onDelete?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void;
      onChange?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void;
    }
  ): RealtimeChannel {
    // Check if already subscribed
    if (this.subscriptions.has(channelName)) {
      console.warn(`⚠️  Channel ${channelName} already exists. Removing old subscription.`);
      this.unsubscribe(channelName);
    }

    const { event = '*', filter, schema = 'public', onInsert, onUpdate, onDelete, onChange } = options;

    // Create channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema,
          table: table as string,
          filter,
        },
        (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => {
          if (import.meta.env.DEV) {
            console.log(`[Realtime ${channelName}] ${payload.eventType}:`, payload);
          }

          try {
            // Call specific event handlers
            switch (payload.eventType) {
              case 'INSERT':
                onInsert?.(payload);
                break;
              case 'UPDATE':
                onUpdate?.(payload);
                break;
              case 'DELETE':
                onDelete?.(payload);
                break;
            }

            // Call general change handler
            onChange?.(payload);
          } catch (error) {
            console.error(`[Realtime ${channelName}] Error processing ${payload.eventType}:`, error);
          }
        }
      )
      .subscribe((status, error) => {
        // Track status internally instead of accessing private properties
        this.subscriptionStatus.set(channelName, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [Realtime] Subscribed to ${channelName}`);
          this.reconnectAttempts.set(channelName, 0);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ [Realtime] Channel error for ${channelName}:`, error);
          this.handleReconnect(channelName, table, options);
        } else if (status === 'TIMED_OUT') {
          console.error(`⏱️  [Realtime] Subscription timeout for ${channelName}`);
          this.handleReconnect(channelName, table, options);
        } else if (status === 'CLOSED') {
          console.log(`🔒 [Realtime] Channel ${channelName} closed`);
        }
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to presence (who's online)
   */
  subscribeToPresence(
    channelName: string,
    options: {
      onJoin?: (key: string, currentPresences: any, newPresences: any) => void;
      onLeave?: (key: string, currentPresences: any, leftPresences: any) => void;
      onSync?: () => void;
    }
  ): RealtimeChannel {
    if (this.subscriptions.has(channelName)) {
      console.warn(`⚠️  Presence channel ${channelName} already exists.`);
      this.unsubscribe(channelName);
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: '', // Will be set when tracking
        },
      },
    });

    // Use the correct presence event API for Supabase 2.58.0
    if (options.onJoin) {
      (channel as any).on('presence', { event: 'join' }, options.onJoin);
    }

    if (options.onLeave) {
      (channel as any).on('presence', { event: 'leave' }, options.onLeave);
    }

    if (options.onSync) {
      (channel as any).on('presence', { event: 'sync' }, options.onSync);
    }

    channel.subscribe((status) => {
      // Track status internally
      this.subscriptionStatus.set(channelName, status);
      
      if (status === 'SUBSCRIBED') {
        console.log(`✅ [Presence] Subscribed to ${channelName}`);
      }
    });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to broadcast messages
   */
  subscribeToBroadcast(
    channelName: string,
    event: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
    if (this.subscriptions.has(channelName)) {
      console.warn(`⚠️  Broadcast channel ${channelName} already exists.`);
      this.unsubscribe(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event }, callback)
      .subscribe((status) => {
        // Track status internally
        this.subscriptionStatus.set(channelName, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [Broadcast] Subscribed to ${channelName}:${event}`);
        }
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect<T extends TableName>(
    channelName: string,
    table: T,
    options: any
  ): void {
    const attempts = this.reconnectAttempts.get(channelName) || 0;
    const maxAttempts = 5;

    if (attempts >= maxAttempts) {
      console.error(`❌ [Realtime] Max reconnection attempts reached for ${channelName}`);
      this.unsubscribe(channelName);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    this.reconnectAttempts.set(channelName, attempts + 1);

    console.log(`🔄 [Realtime] Reconnecting ${channelName} in ${delay}ms (attempt ${attempts + 1}/${maxAttempts})`);

    setTimeout(() => {
      this.unsubscribe(channelName);
      this.subscribe(channelName, table, options);
    }, delay);
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
      this.reconnectAttempts.delete(channelName);
      this.subscriptionStatus.delete(channelName);
      console.log(`🔕 [Realtime] Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    const promises = Array.from(this.subscriptions.keys()).map(channelName =>
      this.unsubscribe(channelName)
    );
    await Promise.all(promises);
    console.log('🔕 [Realtime] Unsubscribed from all channels');
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if a channel is subscribed
   */
  isSubscribed(channelName: string): boolean {
    return this.subscriptions.has(channelName);
  }

  /**
   * Get subscription status
   * Uses internally tracked status instead of accessing private channel properties
   */
  getStatus(channelName: string): string | null {
    return this.subscriptionStatus.get(channelName) || null;
  }

  /**
   * Get a channel by name (public method to avoid accessing private properties)
   */
  getChannel(channelName: string): RealtimeChannel | null {
    return this.subscriptions.get(channelName) || null;
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();

/**
 * React hook for managing realtime subscriptions
 * Usage in components
 */
export function useRealtimeSubscription<T extends TableName>(
  channelName: string,
  table: T,
  options: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
    onInsert?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void;
    onUpdate?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void;
    onDelete?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void;
    onChange?: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void;
    enabled?: boolean;
  }
) {
  const { enabled = true, ...subscriptionOptions } = options;

  // Subscribe on mount
  if (typeof window !== 'undefined' && enabled) {
    // Only run in browser
    const cleanup = () => {
      subscriptionManager.unsubscribe(channelName);
    };

    if (!subscriptionManager.isSubscribed(channelName)) {
      subscriptionManager.subscribe(channelName, table, subscriptionOptions);
    }

    // Return cleanup function
    return cleanup;
  }

  return () => {};
}

/**
 * Utility to track user presence
 */
export async function trackPresence(
  channelName: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const channel = subscriptionManager.subscribeToPresence(channelName, {
    onJoin: (key, current, newPresences) => {
      console.log('User joined:', key, newPresences);
    },
    onLeave: (key, current, leftPresences) => {
      console.log('User left:', key, leftPresences);
    },
    onSync: () => {
      const state = channel.presenceState();
      console.log('Presence synced:', state);
    },
  });

  await channel.track({
    user_id: userId,
    online_at: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Utility to send broadcast messages
 */
export async function sendBroadcast(
  channelName: string,
  event: string,
  payload: any
): Promise<void> {
  try {
    // Use public method instead of accessing private property
    let channel = subscriptionManager.getChannel(channelName);

    if (!channel) {
      channel = supabase.channel(channelName);
      await channel.subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.warn(`[Broadcast] Channel ${channelName} status: ${status}`);
        }
      });
    }

    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });

    console.log(`📡 [Broadcast] Sent ${event} to ${channelName}`);
  } catch (error) {
    console.error(`❌ [Broadcast] Error sending ${event} to ${channelName}:`, error);
    throw error;
  }
}

/**
 * Get connection status
 */
export function getRealtimeStatus(): {
  connected: boolean;
  activeSubscriptions: number;
  subscriptionNames: string[];
} {
  const activeSubscriptions = subscriptionManager.getActiveSubscriptions();
  
  return {
    connected: activeSubscriptions.length > 0,
    activeSubscriptions: activeSubscriptions.length,
    subscriptionNames: activeSubscriptions,
  };
}

/**
 * Cleanup all subscriptions (call on app unmount)
 */
export async function cleanupRealtimeSubscriptions(): Promise<void> {
  await subscriptionManager.unsubscribeAll();
}
