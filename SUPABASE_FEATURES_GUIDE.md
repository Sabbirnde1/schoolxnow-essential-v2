# Supabase Advanced Features - Complete Guide

## Overview
This guide covers the enhanced Supabase client configuration with realtime subscriptions, performance optimization, and security features.

## Table of Contents
1. [Client Configuration](#client-configuration)
2. [Realtime Subscriptions](#realtime-subscriptions)
3. [Performance Optimization](#performance-optimization)
4. [Security Features](#security-features)
5. [Best Practices](#best-practices)

---

## Client Configuration

### Enhanced Features

#### 1. Authentication
```typescript
auth: {
  storage: localStorage,
  storageKey: 'schoolxnow-auth-token', // Custom isolation
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce', // More secure PKCE flow
  debug: import.meta.env.DEV, // Debug in development
}
```

**Benefits:**
- Custom storage key prevents conflicts
- PKCE flow enhances security
- Auto token refresh prevents session expiry
- Debug mode in development only

#### 2. Realtime Configuration
```typescript
realtime: {
  params: {
    eventsPerSecond: 10, // Rate limiting
  },
  heartbeatIntervalMs: 30000, // 30-second heartbeat
  reconnectAfterMs: (tries) => Math.min(1000 * Math.pow(2, tries), 30000),
  logger: import.meta.env.DEV ? console : undefined,
}
```

**Features:**
- Rate limiting prevents overload
- Automatic heartbeat keeps connection alive
- Exponential backoff for reconnection
- Development logging

#### 3. Global Configuration
```typescript
global: {
  headers: {
    'X-Client-Info': 'schoolxnow-essential-v2',
    'X-Client-Version': '2.0',
  },
  fetch: customFetchWithMonitoring,
}
```

**Capabilities:**
- Custom headers for tracking
- Request monitoring and timing
- 30-second timeout on all requests
- Slow request detection (>3s)

---

## Realtime Subscriptions

### Subscription Manager

#### Basic Table Subscription
```typescript
import { subscriptionManager } from '@/lib/realtime-manager';

// Subscribe to table changes
subscriptionManager.subscribe('schools-updates', 'schools', {
  event: '*', // or 'INSERT', 'UPDATE', 'DELETE'
  onInsert: (payload) => {
    console.log('New school:', payload.new);
  },
  onUpdate: (payload) => {
    console.log('Updated school:', payload.old, '→', payload.new);
  },
  onDelete: (payload) => {
    console.log('Deleted school:', payload.old);
  },
  onChange: (payload) => {
    console.log('Any change:', payload);
  },
});
```

#### With Filters
```typescript
// Subscribe to specific records
subscriptionManager.subscribe('my-school', 'schools', {
  filter: `id=eq.${schoolId}`,
  onUpdate: (payload) => {
    setSchoolData(payload.new);
  },
});
```

#### React Component Usage
```typescript
import { useEffect } from 'react';
import { subscriptionManager } from '@/lib/realtime-manager';

function SchoolList() {
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    // Subscribe
    subscriptionManager.subscribe('schools-list', 'schools', {
      onInsert: (payload) => {
        setSchools(prev => [...prev, payload.new]);
      },
      onUpdate: (payload) => {
        setSchools(prev => prev.map(s => 
          s.id === payload.new.id ? payload.new : s
        ));
      },
      onDelete: (payload) => {
        setSchools(prev => prev.filter(s => s.id !== payload.old.id));
      },
    });

    // Cleanup
    return () => {
      subscriptionManager.unsubscribe('schools-list');
    };
  }, []);

  return <div>{/* Render schools */}</div>;
}
```

### Presence Tracking

#### Track Who's Online
```typescript
import { trackPresence } from '@/lib/realtime-manager';

// Track current user
await trackPresence('dashboard-users', userId, {
  name: userName,
  avatar: userAvatar,
  role: userRole,
});
```

#### Subscribe to Presence Changes
```typescript
subscriptionManager.subscribeToPresence('dashboard-users', {
  onJoin: (key, current, newPresences) => {
    console.log('User joined:', newPresences);
    updateOnlineUsers(current);
  },
  onLeave: (key, current, leftPresences) => {
    console.log('User left:', leftPresences);
    updateOnlineUsers(current);
  },
  onSync: () => {
    const channel = subscriptionManager.subscriptions.get('dashboard-users');
    const state = channel.presenceState();
    console.log('All online users:', state);
  },
});
```

### Broadcast Messages

#### Send Messages
```typescript
import { sendBroadcast } from '@/lib/realtime-manager';

// Send notification to all clients
await sendBroadcast('notifications', 'new-message', {
  title: 'New Message',
  body: 'You have a new notification',
  timestamp: new Date().toISOString(),
});
```

#### Receive Messages
```typescript
subscriptionManager.subscribeToBroadcast(
  'notifications',
  'new-message',
  (payload) => {
    showNotification(payload.title, payload.body);
  }
);
```

### Subscription Management

#### Check Status
```typescript
import { getRealtimeStatus } from '@/lib/realtime-manager';

const status = getRealtimeStatus();
console.log(`Connected: ${status.connected}`);
console.log(`Active subscriptions: ${status.activeSubscriptions}`);
console.log(`Channels: ${status.subscriptionNames.join(', ')}`);
```

#### Cleanup
```typescript
import { cleanupRealtimeSubscriptions } from '@/lib/realtime-manager';

// Cleanup all subscriptions (on app unmount)
await cleanupRealtimeSubscriptions();
```

---

## Performance Optimization

### Query Caching

#### Basic Caching
```typescript
import { cachedQuery } from '@/lib/performance-optimizer';

// Cache query for 5 minutes
const schools = await cachedQuery(
  'schools-list',
  async () => {
    const { data } = await supabase.from('schools').select('*');
    return data;
  },
  300000 // 5 minutes TTL
);
```

#### Manual Cache Control
```typescript
import { queryCache } from '@/lib/performance-optimizer';

// Get from cache
const cached = queryCache.get('schools-list');

// Set cache
queryCache.set('schools-list', data, 60000);

// Clear specific cache
queryCache.clear('schools-list');

// Clear all cache
queryCache.clearAll();

// Get statistics
const stats = queryCache.getStats();
console.log(`Cache size: ${stats.size}`);
```

### Batch Queries

#### Execute Multiple Queries
```typescript
import { batchQueries } from '@/lib/performance-optimizer';

const results = await batchQueries({
  schools: async () => {
    const { data } = await supabase.from('schools').select('*');
    return data;
  },
  teachers: async () => {
    const { data } = await supabase.from('teachers').select('*');
    return data;
  },
  students: async () => {
    const { data } = await supabase.from('students').select('*');
    return data;
  },
});

console.log(results.schools, results.teachers, results.students);
```

### Pagination

#### Optimized Pagination
```typescript
import { paginatedQuery } from '@/lib/performance-optimizer';

const result = await paginatedQuery('schools', {
  page: 1,
  pageSize: 20,
  orderBy: 'name',
  orderAscending: true,
  filter: (query) => query.eq('is_active', true),
});

console.log(`Page ${result.page} of ${result.totalPages}`);
console.log(`Total records: ${result.count}`);
console.log('Data:', result.data);
```

### Search Optimization

#### Debounced Search
```typescript
import { SearchOptimizer } from '@/lib/performance-optimizer';

const searchOptimizer = new SearchOptimizer(300); // 300ms debounce

async function handleSearch(term: string) {
  const results = await searchOptimizer.search(term, async (searchTerm) => {
    const { data } = await supabase
      .from('schools')
      .select('*')
      .ilike('name', `%${searchTerm}%`);
    return data;
  });

  setSearchResults(results);
}

// Cancel pending search
searchOptimizer.cancel();
```

### Bulk Operations

#### Bulk Insert
```typescript
import { bulkInsert } from '@/lib/performance-optimizer';

const records = [/* large array of records */];

const result = await bulkInsert('students', records, 1000);

console.log(`✅ Success: ${result.success}`);
console.log(`❌ Failed: ${result.failed}`);
if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
}
```

#### Bulk Update
```typescript
import { bulkUpdate } from '@/lib/performance-optimizer';

const updates = [
  { id: '1', data: { name: 'New Name 1' } },
  { id: '2', data: { name: 'New Name 2' } },
  // ...
];

const result = await bulkUpdate('schools', updates, 100);
console.log(`Updated ${result.success} records`);
```

### Request Deduplication

#### Prevent Duplicate Requests
```typescript
import { requestDeduplicator } from '@/lib/performance-optimizer';

// Multiple calls with same key will reuse the same request
const data1 = await requestDeduplicator.execute('schools-list', fetchSchools);
const data2 = await requestDeduplicator.execute('schools-list', fetchSchools);
// Only one actual request is made
```

### Performance Monitoring

#### Track Operation Performance
```typescript
import { performanceMonitor } from '@/lib/performance-optimizer';

async function loadDashboard() {
  await performanceMonitor.track('load-dashboard', async () => {
    // Your operations
  });
}

// Get performance report
const report = performanceMonitor.getReport();
console.log('Performance Report:', report);

// Reset metrics
performanceMonitor.reset();
```

---

## Security Features

### 1. PKCE Flow
- More secure than implicit flow
- Prevents authorization code interception
- Recommended for all production apps

### 2. Custom Storage Key
- Isolates auth tokens
- Prevents conflicts with other apps
- Easy to clear specific app data

### 3. Request Timeout
- 30-second timeout on all requests
- Prevents hung requests
- Improves error handling

### 4. Rate Limiting
- Realtime events limited to 10/second
- Prevents abuse and overload
- Protects backend resources

### 5. Secure Headers
- Client identification
- Version tracking
- Audit trail capability

---

## Best Practices

### Realtime Subscriptions

#### 1. Always Cleanup
```typescript
useEffect(() => {
  subscriptionManager.subscribe('channel', 'table', options);
  
  return () => {
    subscriptionManager.unsubscribe('channel');
  };
}, []);
```

#### 2. Use Specific Filters
```typescript
// ✅ Good - Specific filter
filter: `school_id=eq.${schoolId}`

// ❌ Bad - No filter (too much data)
filter: undefined
```

#### 3. Handle Reconnection
The subscription manager handles reconnection automatically, but you can add UI feedback:
```typescript
subscriptionManager.subscribe('channel', 'table', {
  // ... options
});

// Check connection status periodically
setInterval(() => {
  const status = subscriptionManager.getStatus('channel');
  if (status !== 'SUBSCRIBED') {
    showReconnectingMessage();
  }
}, 5000);
```

### Performance

#### 1. Cache Appropriately
```typescript
// ✅ Good - Cache static/slow-changing data
cachedQuery('school-settings', fetchSettings, 300000); // 5 min

// ❌ Bad - Cache frequently changing data
cachedQuery('live-attendance', fetchAttendance, 300000); // Don't cache
```

#### 2. Batch When Possible
```typescript
// ✅ Good - Batch queries
const { schools, teachers } = await batchQueries({ schools: fetchSchools, teachers: fetchTeachers });

// ❌ Bad - Sequential queries
const schools = await fetchSchools();
const teachers = await fetchTeachers();
```

#### 3. Use Pagination
```typescript
// ✅ Good - Paginated
const result = await paginatedQuery('students', { page: 1, pageSize: 50 });

// ❌ Bad - Load everything
const { data } = await supabase.from('students').select('*'); // Could be thousands
```

### Security

#### 1. Validate Permissions
Always check RLS policies are in place:
```typescript
// Ensure your RLS policies restrict access properly
// Don't rely solely on client-side checks
```

#### 2. Sanitize Input
```typescript
// ✅ Good - Sanitized search
const searchTerm = userInput.trim().toLowerCase();
query.ilike('name', `%${searchTerm}%`);

// ❌ Bad - Direct user input
query.ilike('name', `%${userInput}%`);
```

#### 3. Handle Errors Gracefully
```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
} catch (error) {
  // Don't expose technical details to users
  showUserFriendlyError();
  logErrorForDevelopers(error);
}
```

---

## Troubleshooting

### Realtime Issues

**Subscription not receiving updates:**
1. Check RLS policies allow SELECT
2. Verify filter syntax
3. Check network connectivity
4. Look for errors in console

**Frequent disconnections:**
1. Check network stability
2. Verify Supabase service status
3. Review heartbeat settings
4. Check client-side errors

### Performance Issues

**Slow queries:**
1. Add appropriate indexes
2. Use pagination
3. Implement caching
4. Check filter efficiency

**High memory usage:**
1. Clear cache regularly
2. Unsubscribe from unused channels
3. Implement proper cleanup
4. Monitor performance metrics

---

## Additional Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Performance Best Practices](https://supabase.com/docs/guides/database/performance)
- [Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- Project Docs:
  - `ERROR_HANDLING_GUIDE.md`
  - `VALIDATION_IMPLEMENTATION.md`
  - `ENV_SETUP.md`
