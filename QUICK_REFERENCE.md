# Configuration Validation - Quick Reference

## 🚀 Quick Start

### First Time Setup:
```bash
# 1. Copy example file
cp .env.example .env

# 2. Edit .env with your credentials
# Get from: https://app.supabase.com/project/_/settings/api

# 3. Start dev server
npm run dev
```

### Check Configuration:
- **Browser**: Visit `http://localhost:8080/config-debug`
- **Console**: Run `diagnoseConfiguration()`

## 📋 Validation Checklist

When you see an error, check:

- [ ] `.env` file exists in project root
- [ ] Variables start with `VITE_`
- [ ] No placeholder values (no "your-", "example", etc.)
- [ ] URL is valid HTTPS format
- [ ] API key starts with "eyJ" (JWT format)
- [ ] Dev server restarted after changes

## ⚡ Common Errors & Quick Fixes

### ❌ "Missing VITE_SUPABASE_URL"
```bash
# Create .env file with:
VITE_SUPABASE_URL=https://your-project.supabase.co
```

### ❌ "Missing VITE_SUPABASE_ANON_KEY"
```bash
# Add to .env file:
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-key
```

### ❌ "Invalid URL format"
- Must be valid HTTPS URL
- Check for typos
- Should look like: `https://xxxxx.supabase.co`

### ❌ "Invalid API key format"
- Must be JWT token starting with "eyJ"
- Copy from Supabase dashboard under "anon public" key
- Don't confuse with service_role key

### ❌ "Placeholder values detected"
- Replace all "your-", "example" values
- Use actual Supabase credentials

### ⚠️ Changes not reflecting
```bash
# Restart dev server (Ctrl+C, then):
npm run dev
```

## 🔍 Diagnostic Tools

### In Browser Console:
```javascript
// Check if configured
import { isSupabaseConfigured } from '@/integrations/supabase/client';
isSupabaseConfigured(); // true/false

// Get config status
import { supabaseConfig } from '@/integrations/supabase/client';
console.log(supabaseConfig);

// Run full diagnostics
import { diagnoseConfiguration } from '@/lib/config-validator';
diagnoseConfiguration();

// Get validation report
import { validateEnvironmentVariables } from '@/lib/config-validator';
const report = validateEnvironmentVariables();
console.log(report);
```

### Debug Page:
Navigate to: `/config-debug`

Shows:
- Configuration status (✅/❌)
- All errors and warnings
- Current values (truncated)
- Step-by-step fixes
- Run diagnostics button

## 📖 Documentation

- **Setup Guide**: `ENV_SETUP.md`
- **Implementation Details**: `VALIDATION_IMPLEMENTATION.md`
- **Security & Improvements**: `IMPROVEMENTS_SUMMARY.md`

## 🆘 Still Having Issues?

1. Visit `/config-debug` in browser
2. Click "Run Full Diagnostics" 
3. Check browser console
4. Take screenshot of errors
5. Review `ENV_SETUP.md`
6. Contact dev team with diagnostic output

## 📱 Mobile/Quick Reference

```
Error? → /config-debug → Follow instructions → Restart server → ✅
```

## 🔐 Security Notes

- Never commit `.env` file
- Use `.env.example` as template
- Rotate keys if exposed
- Use different projects for dev/prod

## ✅ Success Indicators

When properly configured, you'll see:
```
✅ Supabase configuration validated successfully
📍 URL: https://xxxxx.supabase.co
🔑 API Key: eyJhbG...xxxxx
🌍 Mode: development
```

## 🎯 Validation Guarantees

Our validation ensures:
- ✅ Required variables present
- ✅ Correct format and structure
- ✅ No placeholder values
- ✅ Valid URL and API key format
- ✅ Clear error messages
- ✅ Step-by-step solutions

---

## 🔄 Realtime Subscriptions

### Basic Subscription
```typescript
import { subscriptionManager } from '@/lib/realtime-manager';

// Subscribe to changes
subscriptionManager.subscribe('my-channel', 'table_name', {
  event: '*',
  onInsert: (payload) => console.log('New:', payload.new),
  onUpdate: (payload) => console.log('Updated:', payload.new),
  onDelete: (payload) => console.log('Deleted:', payload.old),
});

// Cleanup
subscriptionManager.unsubscribe('my-channel');
```

### React Hook
```typescript
useEffect(() => {
  subscriptionManager.subscribe('channel', 'table', options);
  return () => subscriptionManager.unsubscribe('channel');
}, []);
```

### Check Status
```typescript
import { getRealtimeStatus } from '@/lib/realtime-manager';
const status = getRealtimeStatus();
// { connected: true, activeSubscriptions: 3, subscriptionNames: [...] }
```

---

## ⚡ Performance Optimization

### Query Caching
```typescript
import { cachedQuery } from '@/lib/performance-optimizer';

// Cache for 5 minutes
const data = await cachedQuery('cache-key', async () => {
  return await fetchData();
}, 300000);
```

### Batch Queries
```typescript
import { batchQueries } from '@/lib/performance-optimizer';

const { schools, teachers, students } = await batchQueries({
  schools: () => fetchSchools(),
  teachers: () => fetchTeachers(),
  students: () => fetchStudents(),
});
```

### Pagination
```typescript
import { paginatedQuery } from '@/lib/performance-optimizer';

const result = await paginatedQuery('schools', {
  page: 1,
  pageSize: 20,
  orderBy: 'name',
  filter: (q) => q.eq('is_active', true),
});
// { data: [...], count: 100, page: 1, totalPages: 5 }
```

### Bulk Operations
```typescript
import { bulkInsert, bulkUpdate } from '@/lib/performance-optimizer';

// Insert 1000 records in chunks
await bulkInsert('students', records, 1000);

// Update 100 records at a time
await bulkUpdate('schools', updates, 100);
```

---

## 📚 Full Documentation

- **Setup**: `ENV_SETUP.md`
- **Validation**: `VALIDATION_IMPLEMENTATION.md`
- **Error Handling**: `ERROR_HANDLING_GUIDE.md`
- **Implementation**: `ERROR_HANDLING_IMPLEMENTATION.md`
- **Supabase Features**: `SUPABASE_FEATURES_GUIDE.md`
- **Security**: `SECURITY_CREDENTIALS.md` ⭐ NEW
- **Improvements**: `IMPROVEMENTS_SUMMARY.md`
