# Supabase Error Handling & Logging - Usage Guide

## Overview
This guide explains how to use the enhanced error handling and logging features for Supabase operations.

## Features

### 1. Automatic Error Categorization
Errors are automatically categorized into types:
- `NETWORK` - Connection/network issues
- `AUTHENTICATION` - Auth/session problems
- `AUTHORIZATION` - Permission/RLS issues
- `DATABASE` - Constraint violations, etc.
- `VALIDATION` - Input validation errors
- `UNKNOWN` - Uncategorized errors

### 2. User-Friendly Error Messages
Automatically generates appropriate messages for end users.

### 3. Comprehensive Logging
- Development: Full error details with stack traces
- Production: Essential info only (ready for error tracking services)

### 4. Health Monitoring
- Periodic health checks
- Connection status tracking
- Error counting and alerting

### 5. Automatic Retry Logic
- Configurable retry attempts
- Exponential backoff
- Smart retry (skips auth/permission errors)

## Usage Examples

### Basic Error Handling Wrapper

```typescript
import { withSupabaseErrorHandling } from '@/lib/supabase-error-handler';
import { supabase } from '@/integrations/supabase/client';

async function createSchool(schoolData: any) {
  const { data, error } = await withSupabaseErrorHandling(
    'Create School',
    async () => {
      const { data, error } = await supabase
        .from('schools')
        .insert([schoolData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    { schoolName: schoolData.name } // Optional context for logging
  );

  if (error) {
    // Error is already logged, show to user
    toast({
      title: 'Error Creating School',
      description: error.message, // User-friendly message
      variant: 'destructive',
    });
    return null;
  }

  return data;
}
```

### Using Retry Logic

```typescript
import { withRetry } from '@/lib/supabase-error-handler';
import { supabase } from '@/integrations/supabase/client';

async function fetchSchools() {
  try {
    const schools = await withRetry(
      async () => {
        const { data, error } = await supabase
          .from('schools')
          .select('*');
        
        if (error) throw error;
        return data;
      },
      {
        maxRetries: 3,
        delayMs: 1000,
        backoff: true, // Exponential backoff
        onRetry: (attempt, error) => {
          console.log(`Retrying... Attempt ${attempt}`);
        },
      }
    );

    return schools;
  } catch (error) {
    console.error('Failed after retries:', error);
    return [];
  }
}
```

### Health Monitoring

```typescript
import { checkSupabaseHealth, getSupabaseHealthStatus } from '@/integrations/supabase/client';

// Check health
async function checkConnection() {
  const health = await checkSupabaseHealth();
  
  if (health.healthy) {
    console.log('✅ Connection is healthy');
  } else {
    console.error('❌ Connection issues:', health.message);
    // Show alert to user
  }
}

// Get current status
function getStatus() {
  const status = getSupabaseHealthStatus();
  console.log('Status:', status);
  // { healthy: true, lastCheck: Date, errorCount: 0, consecutiveErrors: 0 }
}
```

### Manual Error Logging

```typescript
import { logSupabaseError, categorizeError, getFriendlyErrorMessage } from '@/lib/supabase-error-handler';

async function customOperation() {
  try {
    // Your operation
    const { data, error } = await supabase.from('schools').select();
    if (error) throw error;
  } catch (error) {
    // Log the error
    logSupabaseError('Custom Operation', error, {
      userId: currentUser.id,
      timestamp: Date.now(),
    });

    // Get error type
    const errorType = categorizeError(error);
    
    // Get friendly message
    const message = getFriendlyErrorMessage(error, 'Custom Operation');
    
    // Show to user
    alert(message);
  }
}
```

## Component Integration Examples

### In React Components

```typescript
import { useState, useEffect } from 'react';
import { withSupabaseErrorHandling } from '@/lib/supabase-error-handler';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

function SchoolList() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSchools();
  }, []);

  async function loadSchools() {
    setLoading(true);
    
    const { data, error } = await withSupabaseErrorHandling(
      'Fetch Schools',
      async () => {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data;
      }
    );

    if (error) {
      toast({
        title: 'Error Loading Schools',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSchools(data || []);
    }

    setLoading(false);
  }

  return (
    // Your component JSX
  );
}
```

### Form Submission with Error Handling

```typescript
async function handleSubmit(formData: any) {
  setLoading(true);
  setErrors({});

  const { data, error } = await withSupabaseErrorHandling(
    'Create School Registration',
    async () => {
      // Create school
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert([formData])
        .select()
        .single();

      if (schoolError) throw schoolError;

      // Create admin user
      const { data: user, error: userError } = await supabase.auth.signUp({
        email: formData.adminEmail,
        password: formData.adminPassword,
      });

      if (userError) {
        // Cleanup: delete the school
        await supabase.from('schools').delete().eq('id', school.id);
        throw userError;
      }

      return { school, user };
    },
    { formData } // Context for debugging
  );

  if (error) {
    toast({
      title: 'Registration Failed',
      description: error.message,
      variant: 'destructive',
    });
    
    // Handle specific error types
    if (error.type === 'DATABASE') {
      setErrors({ form: 'This school may already be registered.' });
    }
  } else {
    toast({
      title: 'Success!',
      description: 'Your school has been registered.',
    });
    navigate('/dashboard');
  }

  setLoading(false);
}
```

## Debugging

### View Logs in Console

Development mode automatically logs:
- Configuration validation
- Operation success/failure
- Detailed error information
- Health check results
- Auth state changes

### Check Health Status

```typescript
// In browser console
import { getSupabaseHealthStatus } from '@/integrations/supabase/client';
getSupabaseHealthStatus();
```

### Manual Health Check

```typescript
// In browser console
import { checkSupabaseHealth } from '@/integrations/supabase/client';
await checkSupabaseHealth();
```

## Error Types and Common Causes

### NETWORK Errors
**Causes:**
- No internet connection
- Supabase service down
- CORS issues
- Firewall blocking

**Solution:**
- Check internet connection
- Verify Supabase status
- Check browser console for CORS errors

### AUTHENTICATION Errors
**Causes:**
- Expired session
- Invalid token
- User not logged in

**Solution:**
- Redirect to login
- Refresh token
- Clear session and re-authenticate

### AUTHORIZATION Errors
**Causes:**
- Insufficient permissions
- RLS policy violation
- Wrong user role

**Solution:**
- Check user permissions
- Review RLS policies
- Verify user role

### DATABASE Errors
**Causes:**
- Duplicate key violation
- Foreign key constraint
- Required field missing

**Solution:**
- Check for existing records
- Verify related records exist
- Validate all required fields

## Best Practices

### 1. Always Use Error Handling Wrapper
```typescript
// ✅ Good
const { data, error } = await withSupabaseErrorHandling('Operation', async () => {
  // your code
});

// ❌ Bad
const { data, error } = await supabase.from('table').select();
if (error) {
  console.error(error); // Limited info
}
```

### 2. Provide Context
```typescript
await withSupabaseErrorHandling(
  'Create School',
  async () => { /* ... */ },
  { userId, schoolName, timestamp } // Context helps debugging
);
```

### 3. Handle Specific Error Types
```typescript
if (error) {
  switch (error.type) {
    case SupabaseErrorType.AUTHENTICATION:
      navigate('/login');
      break;
    case SupabaseErrorType.AUTHORIZATION:
      showPermissionError();
      break;
    default:
      showGenericError(error.message);
  }
}
```

### 4. Use Retry for Network Operations
```typescript
// Use retry for list/read operations
const data = await withRetry(() => fetchData());

// Don't retry for create/update operations (avoid duplicates)
const { data, error } = await withSupabaseErrorHandling(
  'Create Record',
  () => createRecord()
);
```

### 5. Monitor Health Regularly
```typescript
// In app initialization or header component
useEffect(() => {
  const interval = setInterval(async () => {
    const health = await checkSupabaseHealth();
    setConnectionStatus(health.healthy);
  }, 60000); // Check every minute

  return () => clearInterval(interval);
}, []);
```

## Production Considerations

### 1. Error Tracking Service Integration
Uncomment and configure in `supabase-error-handler.ts`:
```typescript
if (!isDev) {
  // Send to Sentry, LogRocket, etc.
  Sentry.captureException(error, {
    tags: { operation, errorType },
    extra: context,
  });
}
```

### 2. Rate Limiting
Add rate limiting to prevent abuse:
```typescript
// Implement in error handler
if (errorCount > threshold) {
  // Temporarily disable operations
  // Show maintenance message
}
```

### 3. Offline Support
```typescript
// Check online status before operations
if (!navigator.onLine) {
  return { data: null, error: new Error('No internet connection') };
}
```

## Troubleshooting

### Issue: Errors not being logged
**Solution:** Check that `import.meta.env.DEV` is true in development

### Issue: Health checks failing
**Solution:** Verify Supabase credentials and network connectivity

### Issue: Too many logs
**Solution:** Logs are dev-only. In production, only errors are logged.

### Issue: Retry not working
**Solution:** Check error type - auth/authorization errors don't retry

## Additional Resources

- [Supabase Error Codes](https://supabase.com/docs/guides/api/error-codes)
- [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- Project documentation: `VALIDATION_IMPLEMENTATION.md`
