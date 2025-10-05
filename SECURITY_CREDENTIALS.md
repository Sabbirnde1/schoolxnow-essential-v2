# Security Best Practices - Credential Protection

## Overview
This document outlines the security measures implemented to protect sensitive credentials (Supabase URL and API keys) from exposure in logs, error messages, and runtime errors.

## 🔒 Security Implementation

### 1. Secure Configuration Manager

The `src/lib/secure-config.ts` module provides a secure layer for accessing and logging credentials:

```typescript
import SecureConfig from '@/lib/secure-config';

// ✅ CORRECT: Get actual credentials for API calls
const url = SecureConfig.getUrl();
const key = SecureConfig.getKey();

// ✅ CORRECT: Get masked versions for logging
const safeUrl = SecureConfig.getSafeUrl();    // https://ktkn***.supabase.co
const safeKey = SecureConfig.getSafeKey();    // eyJhbG********4vKo

// ❌ WRONG: Never log actual credentials
console.log(import.meta.env.VITE_SUPABASE_URL);  // Don't do this!
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);  // Don't do this!
```

### 2. Automatic Credential Redaction

All logging utilities automatically sanitize credentials:

#### In Error Handlers
```typescript
import { logSupabaseError } from '@/lib/supabase-error-handler';

// Errors are automatically sanitized before logging
logSupabaseError('operation', error, context);
// Any URLs or keys in the error are automatically masked
```

#### In Configuration Validation
```typescript
import { diagnoseConfiguration } from '@/lib/config-validator';

// Prints diagnostic info with masked credentials
diagnoseConfiguration();
// Output: URL: https://ktkn***.supabase.co
// Output: Key: eyJhbG********4vKo
```

### 3. Safe Logging Functions

#### Check Before Logging
```typescript
import { isSafeToLog, sanitizeForLog } from '@/lib/secure-config';

const data = { url: process.env.VITE_SUPABASE_URL, other: 'data' };

// Check if safe to log
if (isSafeToLog(data)) {
  console.log(data);
} else {
  console.log(sanitizeForLog(data));  // Auto-masks credentials
}
```

#### Sanitize Any Value
```typescript
import { sanitizeForLog } from '@/lib/secure-config';

const error = new Error('Failed to connect to https://xxx.supabase.co');
console.log(sanitizeForLog(error));
// Output: Failed to connect to https://xxx***.supabase.co
```

---

## 🚫 What NOT to Do

### ❌ Never Log Actual Credentials

```typescript
// DON'T DO THIS:
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);

// DON'T DO THIS:
console.error('Connection failed with URL:', supabaseUrl);

// DON'T DO THIS:
throw new Error(`Failed to connect to ${supabaseUrl}`);
```

### ❌ Never Expose in Error Messages

```typescript
// DON'T DO THIS:
if (!url) {
  throw new Error(`Missing URL: ${url}`);  // Exposes actual URL
}

// DO THIS INSTEAD:
if (!url) {
  throw new Error('Missing Supabase URL configuration');
}
```

### ❌ Never Include in Client-Side Data

```typescript
// DON'T DO THIS:
const config = {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY,
};
return <div>{JSON.stringify(config)}</div>;  // Exposes credentials in DOM

// DO THIS INSTEAD:
import SecureConfig from '@/lib/secure-config';
const safeConfig = {
  url: SecureConfig.getSafeUrl(),
  key: SecureConfig.getSafeKey(),
};
return <div>{JSON.stringify(safeConfig)}</div>;
```

---

## ✅ What TO Do

### Use Secure Accessors

```typescript
import SecureConfig from '@/lib/secure-config';

// For actual API calls
const client = createClient(
  SecureConfig.getUrl(),
  SecureConfig.getKey()
);

// For logging/debugging
console.log('Config status:', SecureConfig.getConfigReport());
// Automatically returns masked values
```

### Sanitize Errors Before Logging

```typescript
import SecureConfig from '@/lib/secure-config';

try {
  // Some operation
} catch (error) {
  // Sanitize before logging
  const safeError = SecureConfig.sanitizeError(error);
  console.error('Operation failed:', safeError);
  
  // Or use the logging utility (automatically sanitizes)
  logSupabaseError('operation', error);
}
```

### Use Safe Configuration Reports

```typescript
import { printSafeConfigReport } from '@/lib/secure-config';

// Prints configuration with masked credentials
printSafeConfigReport();
// Output:
// 🔒 Secure Configuration Report
// URL: https://ktkn***.supabase.co
// Key: eyJhbG********4vKo
```

---

## 🛡️ Production Security Checklist

### Environment Variables
- [ ] Never commit `.env` files
- [ ] Use different credentials for dev/staging/prod
- [ ] Rotate keys if exposed
- [ ] Use `.env.example` as template (with placeholders only)

### Logging
- [ ] All logs use `SecureConfig.getSafeUrl()` and `SecureConfig.getSafeKey()`
- [ ] Error handlers use `SecureConfig.sanitizeError()`
- [ ] No `console.log(import.meta.env.VITE_SUPABASE_*)` in code
- [ ] Third-party error tracking (Sentry, etc.) receives sanitized errors only

### Error Handling
- [ ] Error messages never include actual credentials
- [ ] Stack traces are sanitized before sending to error tracking
- [ ] User-facing errors never expose configuration details
- [ ] Development vs production logging is properly separated

### Code Review
- [ ] Search codebase for `import.meta.env.VITE_SUPABASE_`
- [ ] Verify all instances use SecureConfig methods
- [ ] Check error handlers sanitize before logging
- [ ] Verify no credentials in client-side rendering

---

## 🔍 How It Works

### Credential Masking

#### URL Masking
```typescript
// Input:  https://ktknzhypndszujoakaxq.supabase.co
// Output: https://ktkn***.supabase.co
```

#### API Key Redaction
```typescript
// Input:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0a256...
// Output: eyJhbG********4vKo
```

### Automatic Sanitization

The `SecureConfig.sanitizeError()` function:
1. Searches error object for credential strings
2. Replaces URLs with masked versions
3. Replaces keys with `[REDACTED_KEY]`
4. Returns safe-to-log error object

```typescript
// Original error
Error: Failed to connect to https://ktknzhypndszujoakaxq.supabase.co

// After sanitization
Error: Failed to connect to https://ktkn***.supabase.co
```

---

## 📊 Security Validation

### Test Credential Protection

```typescript
// Test URL protection
const testUrl = import.meta.env.VITE_SUPABASE_URL;
console.log('Test:', testUrl);  // Should only happen in tests

const safeUrl = SecureConfig.getSafeUrl();
console.assert(!safeUrl.includes(testUrl), 'URL is not properly masked');

// Test key protection
const testKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const safeKey = SecureConfig.getSafeKey();
console.assert(!safeKey.includes(testKey.substring(10, 50)), 'Key is not properly masked');
```

### Audit Logging

Search your codebase for potential credential exposure:

```bash
# Find direct environment variable access (should only be in secure-config.ts)
grep -r "import.meta.env.VITE_SUPABASE_URL" src/

# Find direct key access
grep -r "import.meta.env.VITE_SUPABASE_ANON_KEY" src/

# Should only find usage in:
# - src/lib/secure-config.ts (the secure accessor)
```

---

## 🚨 Incident Response

### If Credentials Are Exposed

1. **Immediately Rotate Credentials**
   - Go to Supabase Dashboard → Settings → API
   - Generate new API keys
   - Update `.env` files in all environments
   - Restart all servers

2. **Review Exposure Scope**
   - Check logs for unauthorized access
   - Review error tracking services
   - Check git history
   - Review any public deployments

3. **Update Security**
   - Verify all code uses `SecureConfig`
   - Run security audit
   - Update security documentation
   - Train team on secure practices

### Prevention

- Regular security audits
- Code review checklist
- Automated scanning for credential patterns
- Security training for developers

---

## 📚 Related Documentation

- `ENV_SETUP.md` - Environment variable setup
- `ERROR_HANDLING_GUIDE.md` - Error handling patterns
- `ERROR_HANDLING_IMPLEMENTATION.md` - Implementation details
- `SUPABASE_FEATURES_GUIDE.md` - Supabase features
- `src/lib/secure-config.ts` - Source code

---

## 🔐 API Reference

### SecureConfig Class

```typescript
// Get actual credentials (use only for API calls, never log)
SecureConfig.getUrl(): string
SecureConfig.getKey(): string

// Get masked credentials (safe for logging)
SecureConfig.getSafeUrl(): string
SecureConfig.getSafeKey(): string

// Validation
SecureConfig.isConfigured(): boolean
SecureConfig.validate(): { isValid: boolean, errors: string[], safeInfo: Record<string, string> }

// Sanitization
SecureConfig.sanitizeError(error: any): any
SecureConfig.getConfigReport(): { configured: boolean, url: string, key: string, environment: string, warnings: string[] }
```

### Utility Functions

```typescript
// From secure-config.ts
redactString(value: string, visibleChars?: number): string
maskUrl(url: string): string
printSafeConfigReport(): void
isSafeToLog(value: any): boolean
sanitizeForLog(value: any): any
```

---

## ✅ Summary

### Key Principles

1. **Never log actual credentials** - Always use masked versions
2. **Sanitize before logging** - Use `SecureConfig.sanitizeError()`
3. **Use secure accessors** - Use `SecureConfig.getUrl()` not `import.meta.env`
4. **Validate in code reviews** - Check for direct environment variable access
5. **Rotate if exposed** - Immediate action if credentials leak

### Implementation Status

- ✅ Secure configuration manager implemented
- ✅ All logging utilities sanitize credentials
- ✅ Validation reports use masked values
- ✅ Error handlers automatically sanitize
- ✅ Configuration reports are safe by default
- ✅ Development and production modes properly separated

**Your credentials are now protected from exposure in logs and errors! 🔒**
