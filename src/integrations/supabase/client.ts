// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import SecureConfig from '@/lib/secure-config';

/**
 * Validates the configuration before creating the Supabase client
 * @throws {Error} If configuration is invalid
 * @security Credentials are never exposed in error messages or logs
 */
function validateSupabaseConfig(): { url: string; key: string } {
  // Use secure configuration validation
  const validation = SecureConfig.validate();

  if (!validation.isValid) {
    // Log safe diagnostic information only
    console.error('❌ Supabase Configuration Error');
    console.error('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
    console.error('Action: Copy .env.example to .env and fill in your Supabase credentials');
    
    // Log safe configuration info (no actual credentials)
    console.group('Configuration Status');
    Object.entries(validation.safeInfo).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.groupEnd();

    // Log errors without exposing credentials
    console.group('Validation Errors');
    validation.errors.forEach(error => console.error(`  • ${error}`));
    console.groupEnd();

    throw new Error(
      '🔴 CONFIGURATION ERROR: Invalid Supabase configuration.\n' +
      'Please check your .env file and ensure all required variables are set correctly.\n' +
      'See ENV_SETUP.md for detailed setup instructions.\n' +
      'Errors: ' + validation.errors.join(', ')
    );
  }

  // Log success in development (with safe values only)
  if (import.meta.env.DEV) {
    console.log('✅ Supabase configuration validated successfully');
    console.log('📍 URL:', SecureConfig.getSafeUrl());
    console.log('🔑 API Key:', SecureConfig.getSafeKey());
    console.log('🌍 Mode:', import.meta.env.MODE);
  }

  // Return actual credentials for use (but never log them)
  return {
    url: SecureConfig.getUrl(),
    key: SecureConfig.getKey(),
  };
}

// Validate configuration before creating client
const config = validateSupabaseConfig();

// Import error handling utilities
import { SupabaseHealthMonitor, logSupabaseError } from '@/lib/supabase-error-handler';

// Create the Supabase client with validated configuration
// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(config.url, config.key, {
  auth: {
    storage: localStorage,
    storageKey: 'schoolxnow-auth-token', // Custom storage key for isolation
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // More secure PKCE flow type
    debug: import.meta.env.DEV, // Enable auth debugging in development
  },
  realtime: {
    // Realtime configuration for live updates
    params: {
      eventsPerSecond: 10, // Rate limit for realtime events
    },
    heartbeatIntervalMs: 30000, // Heartbeat every 30 seconds
    reconnectAfterMs: (tries: number) => {
      // Exponential backoff for reconnection
      return Math.min(1000 * Math.pow(2, tries), 30000);
    },
    logger: (level: string, message: string, ...args: any[]) => {
      if (import.meta.env.DEV) {
        console.log(`[Realtime ${level}]`, message, ...args);
      }
    },
  },
  db: {
    schema: 'public', // Default schema
  },
  global: {
    headers: {
      'X-Client-Info': 'schoolxnow-essential-v2',
      'X-Client-Version': '2.0',
    },
    fetch: (url, options: any = {}) => {
      // Custom fetch wrapper for monitoring and error handling
      const startTime = performance.now();
      
      return fetch(url, {
        ...options,
        // Add timeout to all requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })
        .then(response => {
          const duration = Math.round(performance.now() - startTime);
          
          if (import.meta.env.DEV) {
            console.log(`[Supabase Request] ${options.method || 'GET'} completed in ${duration}ms`);
          }
          
          // Log slow requests
          if (duration > 3000) {
            console.warn(`⚠️  Slow request detected: ${duration}ms for ${url}`);
          }
          
          return response;
        })
        .catch(error => {
          const duration = Math.round(performance.now() - startTime);
          console.error(`[Supabase Request] Failed after ${duration}ms:`, error);
          throw error;
        });
    },
  },
});

// Initialize health monitor
export const healthMonitor = new SupabaseHealthMonitor(supabase as any);

// Set up auth state change listener with error handling
supabase.auth.onAuthStateChange((event, session) => {
  if (import.meta.env.DEV) {
    console.log('🔐 [Auth State Change]', {
      event,
      userId: session?.user?.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Reset error counters on successful auth
  if (event === 'SIGNED_IN') {
    healthMonitor.reset();
  }

  // Log auth errors
  if (event === 'TOKEN_REFRESHED' && !session) {
    logSupabaseError('Auth Token Refresh', new Error('Token refresh failed'));
  }
});

// Periodic health check (every 5 minutes in development)
if (import.meta.env.DEV) {
  setInterval(async () => {
    const health = await healthMonitor.checkHealth();
    if (!health.healthy) {
      console.warn('⚠️  Supabase health check failed:', health);
    }
  }, 5 * 60 * 1000);
}

// Initial health check
if (import.meta.env.DEV) {
  setTimeout(() => {
    healthMonitor.checkHealth();
  }, 2000); // Wait 2 seconds after initialization
}

// Export a function to check if the client is properly configured
export function isSupabaseConfigured(): boolean {
  try {
    validateSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}

// Export configuration status for debugging
export const supabaseConfig = {
  isConfigured: true,
  url: config.url,
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
} as const;

// Export health check function
export async function checkSupabaseHealth() {
  return healthMonitor.checkHealth();
}

// Export health status
export function getSupabaseHealthStatus() {
  return healthMonitor.getStatus();
}

/**
 * Comprehensive diagnostic function to check multiple Supabase features
 * @returns Object with test results for each feature
 */
export async function runSupabaseDiagnostics() {
  const results: any = {
    timestamp: new Date().toISOString(),
    connection: { success: false, latency: 0, error: null },
    auth: { success: false, error: null },
    database: { success: false, tables: null, error: null },
    storage: { success: false, buckets: null, error: null },
    realtime: { success: false, error: null },
    functions: { success: false, error: null }
  };
  
  // Test connection
  try {
    const health = await healthMonitor.checkHealth();
    // Manually time a simple request to estimate latency
    const startTime = performance.now();
    await supabase.from('schools').select('id', { count: 'exact', head: true });
    const latency = Math.round(performance.now() - startTime);
    
    results.connection = {
      success: health.healthy,
      latency,
      error: health.healthy ? null : health.message
    };
  } catch (error: any) {
    results.connection.error = error.message;
  }
  
  // Test database
  try {
    const start = performance.now();
    // Use a known table instead of pg_catalog.pg_tables
    // Get a list of known tables in our schema
    const knownTables = ['schools', 'students', 'teachers', 'classes', 'subjects', 'user_profiles'];
    const tableResults = [];
    
    // Test each table with count query
    for (const table of knownTables) {
      try {
        let count = 0;
        let error = null;
        
        // Handle each table with proper typing
        if (table === 'schools') {
          const result = await supabase.from('schools').select('*', { count: 'exact', head: true });
          count = result.count || 0;
          error = result.error;
        } else if (table === 'students') {
          const result = await supabase.from('students').select('*', { count: 'exact', head: true });
          count = result.count || 0;
          error = result.error;
        } else if (table === 'teachers') {
          const result = await supabase.from('teachers').select('*', { count: 'exact', head: true });
          count = result.count || 0;
          error = result.error;
        } else if (table === 'classes') {
          const result = await supabase.from('classes').select('*', { count: 'exact', head: true });
          count = result.count || 0;
          error = result.error;
        } else if (table === 'subjects') {
          const result = await supabase.from('subjects').select('*', { count: 'exact', head: true });
          count = result.count || 0;
          error = result.error;
        } else if (table === 'user_profiles') {
          const result = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
          count = result.count || 0;
          error = result.error;
        }
          
        tableResults.push({
          name: table,
          exists: !error,
          count: count || 0
        });
      } catch (e) {
        tableResults.push({
          name: table,
          exists: false,
          error: (e as Error).message
        });
      }
    }
      
    const latencyMs = Math.round(performance.now() - start);
    results.database = {
      success: tableResults.some(t => t.exists),
      tables: tableResults,
      latencyMs,
      error: null
    };
  } catch (error: any) {
    results.database.error = error.message;
  }
  
  // Test storage
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    results.storage = {
      success: true,
      buckets: buckets.map(b => b.name),
      error: null
    };
  } catch (error: any) {
    results.storage.error = error.message;
  }
  
  // Test realtime (just check if it's available, don't actually subscribe)
  try {
    // Create and immediately remove a channel to test if realtime is available
    const channel = supabase.channel('diagnostic-test');
    await supabase.removeChannel(channel);
    results.realtime.success = true;
  } catch (error: any) {
    results.realtime.error = error.message;
  }
  
  // Test functions API (not actual functions)
  try {
    // We can't reliably test Edge Functions due to CORS restrictions in browsers
    // Instead, we'll just report that verification needs to be done manually
    // or through the diagnostic scripts which use Node.js
    
    results.functions = {
      success: null, // null means "cannot determine automatically"
      error: null,
      status: "Requires manual verification due to browser CORS restrictions",
      info: "Use the diagnostic script (npm run diagnose) for a more reliable check"
    };
    
    // We'll still try a basic check, but we won't consider failures as definitive
    try {
      // Try a function check with minimal permissions needed
      const functionTest = await fetch(`${config.url}/functions/v1/health-check`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Even a 404 is a good sign - it means the functions API is accessible
      if (functionTest.status === 404) {
        results.functions.success = true;
        results.functions.status = "Edge Functions API accessible (function doesn't exist)";
      } else if (functionTest.ok) {
        results.functions.success = true;
        results.functions.status = "Edge Functions API accessible and function exists";
      }
    } catch (e) {
      // Ignore errors - they're expected due to CORS
    }
  } catch (error) {
    // We won't mark this as a failure since browser tests are unreliable for functions
    results.functions.info = "Error during test: " + error.message;
  }
  
  return results;
}