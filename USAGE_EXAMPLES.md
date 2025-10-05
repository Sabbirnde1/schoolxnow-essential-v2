# SchoolXnow - Usage Examples

Complete code examples for common scenarios in the SchoolXnow application.

## Table of Contents
1. [Realtime Features](#realtime-features)
2. [Performance Optimization](#performance-optimization)
3. [Error Handling](#error-handling)
4. [Full Component Examples](#full-component-examples)

---

## Realtime Features

### Example 1: Live Student List

```typescript
import { useEffect, useState } from 'react';
import { subscriptionManager } from '@/lib/realtime-manager';
import { supabase } from '@/integrations/supabase/client';
import { withSupabaseErrorHandling } from '@/lib/supabase-error-handler';

interface Student {
  id: string;
  name: string;
  class_id: string;
  is_active: boolean;
}

function LiveStudentList({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial data load
    const loadStudents = withSupabaseErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId)
          .eq('is_active', true);
        
        if (error) throw error;
        setStudents(data || []);
        setLoading(false);
      },
      'students',
      'select'
    );

    loadStudents().catch((err) => {
      setError(err.friendlyMessage);
      setLoading(false);
    });

    // Subscribe to realtime updates
    subscriptionManager.subscribe(`students-${classId}`, 'students', {
      filter: `class_id=eq.${classId}`,
      onInsert: (payload) => {
        setStudents((prev) => [...prev, payload.new as Student]);
      },
      onUpdate: (payload) => {
        setStudents((prev) =>
          prev.map((s) => (s.id === payload.new.id ? payload.new as Student : s))
        );
      },
      onDelete: (payload) => {
        setStudents((prev) => prev.filter((s) => s.id !== payload.old.id));
      },
    });

    // Cleanup
    return () => {
      subscriptionManager.unsubscribe(`students-${classId}`);
    };
  }, [classId]);

  if (loading) return <div>Loading students...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="student-list">
      <h2>Students (Live Updates)</h2>
      {students.length === 0 ? (
        <p>No students in this class</p>
      ) : (
        <ul>
          {students.map((student) => (
            <li key={student.id}>{student.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LiveStudentList;
```

### Example 2: Online Users Presence

```typescript
import { useEffect, useState } from 'react';
import { subscriptionManager, trackPresence } from '@/lib/realtime-manager';
import { useAuth } from '@/hooks/useAuth';

interface OnlineUser {
  userId: string;
  name: string;
  avatar?: string;
  role: string;
  lastSeen: string;
}

function OnlineUsers() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!user) return;

    // Track current user presence
    trackPresence('dashboard', user.id, {
      name: user.user_metadata?.full_name || 'Anonymous',
      avatar: user.user_metadata?.avatar_url,
      role: user.user_metadata?.role || 'user',
    });

    // Subscribe to presence changes
    subscriptionManager.subscribeToPresence('dashboard', {
      onJoin: (key, current) => {
        updateOnlineUsers(current);
      },
      onLeave: (key, current) => {
        updateOnlineUsers(current);
      },
      onSync: () => {
        const channel = subscriptionManager.subscriptions.get('dashboard');
        if (channel) {
          const state = channel.presenceState();
          updateOnlineUsers(state);
        }
      },
    });

    function updateOnlineUsers(presenceState: any) {
      const users: OnlineUser[] = [];
      Object.keys(presenceState).forEach((key) => {
        const presences = presenceState[key];
        presences.forEach((presence: any) => {
          users.push({
            userId: key,
            name: presence.name,
            avatar: presence.avatar,
            role: presence.role,
            lastSeen: new Date().toISOString(),
          });
        });
      });
      setOnlineUsers(users);
    }

    return () => {
      subscriptionManager.unsubscribe('dashboard');
    };
  }, [user]);

  return (
    <div className="online-users">
      <h3>Online Now ({onlineUsers.length})</h3>
      <div className="users-list">
        {onlineUsers.map((user) => (
          <div key={user.userId} className="user-badge">
            {user.avatar && <img src={user.avatar} alt={user.name} />}
            <span>{user.name}</span>
            <span className="role">{user.role}</span>
            <span className="status-indicator">●</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OnlineUsers;
```

### Example 3: Real-time Notifications

```typescript
import { useEffect, useState } from 'react';
import { subscriptionManager, sendBroadcast } from '@/lib/realtime-manager';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Subscribe to broadcast notifications
    subscriptionManager.subscribeToBroadcast(
      'notifications',
      'new-notification',
      (payload) => {
        const notification: Notification = {
          id: crypto.randomUUID(),
          title: payload.title,
          message: payload.message,
          type: payload.type || 'info',
          timestamp: payload.timestamp || new Date().toISOString(),
        };
        
        setNotifications((prev) => [notification, ...prev]);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          dismissNotification(notification.id);
        }, 5000);
      }
    );

    return () => {
      subscriptionManager.unsubscribe('notifications');
    };
  }, []);

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  // Helper to send notification to all users
  async function broadcastNotification(
    title: string,
    message: string,
    type: Notification['type'] = 'info'
  ) {
    await sendBroadcast('notifications', 'new-notification', {
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <>
      {/* Notification display */}
      <div className="notifications">
        {notifications.map((notif) => (
          <div key={notif.id} className={`notification notification-${notif.type}`}>
            <strong>{notif.title}</strong>
            <p>{notif.message}</p>
            <button onClick={() => dismissNotification(notif.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Example: Send notification button (admin only) */}
      <button
        onClick={() =>
          broadcastNotification(
            'System Update',
            'The system will be updated in 10 minutes',
            'warning'
          )
        }
      >
        Send Notification to All
      </button>
    </>
  );
}

export default NotificationSystem;
```

---

## Performance Optimization

### Example 4: Cached Dashboard Data

```typescript
import { useEffect, useState } from 'react';
import { cachedQuery, queryCache } from '@/lib/performance-optimizer';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeSchools: number;
}

function CachedDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<'cached' | 'fresh'>('fresh');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    setLoading(true);

    // Check if data is already cached
    const cached = queryCache.get('dashboard-stats');
    if (cached) {
      setStats(cached as DashboardStats);
      setCacheStatus('cached');
      setLoading(false);
      return;
    }

    // Load with 5-minute cache
    const data = await cachedQuery(
      'dashboard-stats',
      async () => {
        const [students, teachers, classes, schools] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('teachers').select('id', { count: 'exact', head: true }),
          supabase.from('classes').select('id', { count: 'exact', head: true }),
          supabase.from('schools').select('id', { count: 'exact', head: true }).eq('is_active', true),
        ]);

        return {
          totalStudents: students.count || 0,
          totalTeachers: teachers.count || 0,
          totalClasses: classes.count || 0,
          activeSchools: schools.count || 0,
        };
      },
      300000 // 5 minutes
    );

    setStats(data as DashboardStats);
    setCacheStatus('fresh');
    setLoading(false);
  }

  function refreshStats() {
    queryCache.clear('dashboard-stats');
    loadDashboardStats();
  }

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <div className="stats-header">
        <h2>Dashboard Statistics</h2>
        <div>
          <span className={`cache-badge ${cacheStatus}`}>
            {cacheStatus === 'cached' ? '📦 Cached' : '🆕 Fresh'}
          </span>
          <button onClick={refreshStats}>Refresh</button>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalStudents}</h3>
          <p>Total Students</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalTeachers}</h3>
          <p>Total Teachers</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalClasses}</h3>
          <p>Total Classes</p>
        </div>
        <div className="stat-card">
          <h3>{stats.activeSchools}</h3>
          <p>Active Schools</p>
        </div>
      </div>
    </div>
  );
}

export default CachedDashboard;
```

### Example 5: Paginated Table with Search

```typescript
import { useState, useEffect } from 'react';
import { paginatedQuery, SearchOptimizer } from '@/lib/performance-optimizer';
import { supabase } from '@/integrations/supabase/client';

interface School {
  id: string;
  name: string;
  eiin_number: string;
  is_active: boolean;
}

const searchOptimizer = new SearchOptimizer(300); // 300ms debounce

function PaginatedSchoolTable() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 20;

  useEffect(() => {
    loadSchools();
  }, [page, searchTerm]);

  async function loadSchools() {
    setLoading(true);

    // Use search optimizer for debounced search
    const results = await searchOptimizer.search(searchTerm, async (term) => {
      const result = await paginatedQuery('schools', {
        page,
        pageSize,
        orderBy: 'name',
        orderAscending: true,
        filter: (query) => {
          let q = query;
          if (term) {
            q = q.or(`name.ilike.%${term}%,eiin_number.ilike.%${term}%`);
          }
          return q;
        },
      });

      return result;
    });

    if (results) {
      setSchools(results.data as School[]);
      setTotalPages(results.totalPages);
      setTotalCount(results.count);
    }

    setLoading(false);
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setPage(1); // Reset to first page
  }

  return (
    <div className="paginated-table">
      <div className="table-header">
        <h2>Schools ({totalCount})</h2>
        <input
          type="text"
          placeholder="Search schools..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>EIIN Number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id}>
                  <td>{school.name}</td>
                  <td>{school.eiin_number}</td>
                  <td>{school.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default PaginatedSchoolTable;
```

### Example 6: Bulk Data Import

```typescript
import { useState } from 'react';
import { bulkInsert } from '@/lib/performance-optimizer';
import { withSupabaseErrorHandling } from '@/lib/supabase-error-handler';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

function BulkStudentImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');

      // Convert to student records
      const students = lines.slice(1).map((line) => {
        const values = line.split(',');
        return {
          name: values[0]?.trim(),
          email: values[1]?.trim(),
          class_id: values[2]?.trim(),
          date_of_birth: values[3]?.trim(),
          is_active: true,
        };
      }).filter((s) => s.name && s.email); // Filter out invalid rows

      console.log(`Importing ${students.length} students...`);

      // Bulk insert with error handling
      const importOperation = withSupabaseErrorHandling(
        async () => {
          return await bulkInsert('students', students, 1000);
        },
        'students',
        'insert'
      );

      const importResult = await importOperation();
      setResult(importResult);

      if (importResult.success > 0) {
        alert(`Successfully imported ${importResult.success} students!`);
      }
      if (importResult.failed > 0) {
        alert(`Failed to import ${importResult.failed} students. Check errors below.`);
      }
    } catch (error: any) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="bulk-import">
      <h2>Bulk Student Import</h2>
      
      <div className="import-instructions">
        <p>Upload a CSV file with the following columns:</p>
        <code>name, email, class_id, date_of_birth</code>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={importing}
      />

      {importing && (
        <div className="importing">
          <div className="spinner" />
          <p>Importing students... This may take a moment.</p>
        </div>
      )}

      {result && (
        <div className="import-results">
          <h3>Import Results</h3>
          <div className="result-stats">
            <div className="stat success">
              <strong>{result.success}</strong>
              <span>Successful</span>
            </div>
            <div className="stat failed">
              <strong>{result.failed}</strong>
              <span>Failed</span>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="errors">
              <h4>Errors:</h4>
              <ul>
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BulkStudentImport;
```

---

## Error Handling

### Example 7: Comprehensive Error Handling

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  withSupabaseErrorHandling,
  categorizeError,
  getFriendlyErrorMessage,
  SupabaseErrorType,
} from '@/lib/supabase-error-handler';

function SchoolRegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    eiin_number: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{
    type: SupabaseErrorType;
    message: string;
    technicalMessage: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Wrapped operation with error handling
    const registerSchool = withSupabaseErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from('schools')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'schools',
      'insert'
    );

    try {
      const school = await registerSchool();
      alert(`School registered successfully! ID: ${school.id}`);
      
      // Reset form
      setFormData({ name: '', eiin_number: '', address: '' });
    } catch (err: any) {
      // Categorize and display error
      const errorType = categorizeError(err);
      const friendlyMessage = getFriendlyErrorMessage(err);

      setError({
        type: errorType,
        message: friendlyMessage,
        technicalMessage: err.message || String(err),
      });

      // Handle specific error types
      switch (errorType) {
        case SupabaseErrorType.VALIDATION:
          console.warn('Validation error:', err);
          break;
        case SupabaseErrorType.AUTHORIZATION:
          console.error('Authorization error - check RLS policies:', err);
          break;
        case SupabaseErrorType.NETWORK:
          console.error('Network error - check connection:', err);
          break;
        default:
          console.error('Unexpected error:', err);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register New School</h2>

      {error && (
        <div className={`error-message error-${error.type.toLowerCase()}`}>
          <h4>Error: {error.type}</h4>
          <p>{error.message}</p>
          {import.meta.env.DEV && (
            <details>
              <summary>Technical Details</summary>
              <pre>{error.technicalMessage}</pre>
            </details>
          )}
        </div>
      )}

      <input
        type="text"
        placeholder="School Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <input
        type="text"
        placeholder="EIIN Number"
        value={formData.eiin_number}
        onChange={(e) => setFormData({ ...formData, eiin_number: e.target.value })}
        required
      />

      <textarea
        placeholder="Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        required
      />

      <button type="submit" disabled={submitting}>
        {submitting ? 'Registering...' : 'Register School'}
      </button>
    </form>
  );
}

export default SchoolRegistrationForm;
```

---

## Full Component Examples

### Example 8: Complete Dashboard with All Features

```typescript
import { useEffect, useState } from 'react';
import { subscriptionManager } from '@/lib/realtime-manager';
import { batchQueries, cachedQuery } from '@/lib/performance-optimizer';
import { withSupabaseErrorHandling } from '@/lib/supabase-error-handler';
import { supabase } from '@/integrations/supabase/client';

interface DashboardData {
  schools: any[];
  students: any[];
  teachers: any[];
  recentActivity: any[];
}

function CompleteDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');

  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscriptions();

    return () => {
      cleanupSubscriptions();
    };
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);

    const loadData = withSupabaseErrorHandling(
      async () => {
        // Batch multiple queries with caching
        const results = await batchQueries({
          schools: () =>
            cachedQuery('dashboard-schools', async () => {
              const { data } = await supabase
                .from('schools')
                .select('*')
                .eq('is_active', true)
                .limit(10);
              return data;
            }, 60000),
          
          students: () =>
            cachedQuery('dashboard-students', async () => {
              const { data } = await supabase
                .from('students')
                .select('*, classes(*)')
                .eq('is_active', true)
                .limit(50);
              return data;
            }, 60000),
          
          teachers: () =>
            cachedQuery('dashboard-teachers', async () => {
              const { data } = await supabase
                .from('teachers')
                .select('*')
                .eq('is_active', true)
                .limit(30);
              return data;
            }, 60000),
          
          recentActivity: async () => {
            const { data } = await supabase
              .from('audit_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(20);
            return data;
          },
        });

        return results as DashboardData;
      },
      'dashboard',
      'select'
    );

    try {
      const dashboardData = await loadData();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  function setupRealtimeSubscriptions() {
    // Subscribe to school updates
    subscriptionManager.subscribe('dashboard-schools', 'schools', {
      event: '*',
      onChange: () => {
        // Invalidate cache and reload
        loadDashboardData();
      },
    });

    // Subscribe to recent activity
    subscriptionManager.subscribe('dashboard-activity', 'audit_logs', {
      event: 'INSERT',
      onInsert: (payload) => {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentActivity: [payload.new, ...prev.recentActivity].slice(0, 20),
          };
        });
      },
    });

    setRealtimeStatus('connected');
  }

  function cleanupSubscriptions() {
    subscriptionManager.unsubscribe('dashboard-schools');
    subscriptionManager.unsubscribe('dashboard-activity');
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={loadDashboardData}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>SchoolXnow Dashboard</h1>
        <div className="status-indicators">
          <span className={`status ${realtimeStatus}`}>
            {realtimeStatus === 'connected' ? '🟢' : '🔴'} Realtime
          </span>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Stats Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <h3>{data.schools?.length || 0}</h3>
            <p>Active Schools</p>
          </div>
          <div className="stat-card">
            <h3>{data.students?.length || 0}</h3>
            <p>Students</p>
          </div>
          <div className="stat-card">
            <h3>{data.teachers?.length || 0}</h3>
            <p>Teachers</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-section">
          <h2>Recent Activity</h2>
          <ul className="activity-list">
            {data.recentActivity?.map((activity) => (
              <li key={activity.id}>
                <span className="timestamp">
                  {new Date(activity.created_at).toLocaleString()}
                </span>
                <span className="action">{activity.action}</span>
                <span className="user">{activity.user_id}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CompleteDashboard;
```

---

## Best Practices Summary

### 1. Always Handle Errors
```typescript
const operation = withSupabaseErrorHandling(async () => {
  // Your Supabase operation
}, 'table_name', 'operation_type');
```

### 2. Clean Up Subscriptions
```typescript
useEffect(() => {
  subscriptionManager.subscribe(/* ... */);
  return () => subscriptionManager.unsubscribe(/* ... */);
}, []);
```

### 3. Cache Appropriately
```typescript
// Cache static data
await cachedQuery('key', fetchStaticData, 300000);

// Don't cache live data
const liveData = await fetchLiveData(); // No cache
```

### 4. Use Pagination
```typescript
// Don't load everything at once
const result = await paginatedQuery('table', { page, pageSize: 20 });
```

### 5. Batch Related Queries
```typescript
// Execute in parallel
const { data1, data2 } = await batchQueries({
  data1: fetch1,
  data2: fetch2,
});
```

---

For more information, see:
- `SUPABASE_FEATURES_GUIDE.md` - Complete feature documentation
- `ERROR_HANDLING_GUIDE.md` - Error handling patterns
- `QUICK_REFERENCE.md` - Quick reference guide
