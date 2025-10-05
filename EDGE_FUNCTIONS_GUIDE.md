# SchoolXnow Edge Functions Guide

This guide provides a comprehensive overview of Supabase Edge Functions in the SchoolXnow application, including troubleshooting common issues, deployment instructions, and best practices.

## What are Edge Functions?

Edge Functions are serverless functions that run on Supabase's infrastructure. They allow you to execute code close to your users, without having to manage servers. SchoolXnow uses Edge Functions for various tasks that require server-side processing.

## Available Diagnostic Tools

We've provided several tools to help diagnose and troubleshoot Edge Function issues:

1. **Browser-based Test Suite**
   * Navigate to `/supabase-test-suite` in your browser
   * Select the "Functions" tab
   * Run the test and view detailed logs

2. **Server-side Diagnostic Script**
   * Run `npm run test:edge-functions-cors` in your terminal
   * This bypasses browser CORS restrictions for more accurate diagnostics

3. **Pre-configured Test Function**
   * Located in `/supabase/functions/hello-world/`
   * Ready to deploy for testing your Edge Functions setup

## Common Issues & Solutions

### 1. "Failed to send a request to the Edge Function"

This error typically occurs when your browser cannot establish a connection to the Edge Functions service.

**Causes & Solutions:**

* **CORS Configuration Missing**
  * In Supabase Dashboard, go to Settings → API → CORS
  * Add your application origin (e.g., `http://localhost:8083`)
  * Ensure you include the protocol (`http://` or `https://`)
  * Don't add trailing slashes

* **Edge Functions Not Deployed**
  * Deploy the test function: `supabase functions deploy hello-world`
  * Check deployment status in Supabase Dashboard

* **Network Issues**
  * Check if your network/firewall blocks outbound connections
  * Try accessing from a different network

### 2. "Function not found" Error

This means the Edge Functions service is working, but the specific function you're calling doesn't exist.

**Solutions:**
* Verify function name spelling (case-sensitive)
* Deploy the function using Supabase CLI
* Check function name in Supabase Dashboard → Edge Functions

### 3. Authorization Errors

**Common Authentication Issues:**
* Missing JWT token
* Expired JWT token
* Insufficient permissions

**Solutions:**
* Ensure user is authenticated before calling secure functions
* Verify your JWT token is valid and not expired
* Check if the function requires authentication

## Deploying Edge Functions

### Prerequisites
* Supabase CLI installed
* Supabase account and project set up
* Project linked to your Supabase account

### Deployment Steps

1. Navigate to the functions directory:
   ```bash
   cd supabase/functions
   ```

2. Deploy a function:
   ```bash
   supabase functions deploy hello-world
   ```

3. Verify deployment in Supabase Dashboard

### Testing Deployed Functions

After deployment, test your function:

1. Using the browser test suite at `/supabase-test-suite`
2. Using the CLI: `npm run test:edge-functions-cors`
3. Direct API call (replace with your project ID):
   ```bash
   curl -X POST https://your-project-id.functions.supabase.co/hello-world \
     -H "Content-Type: application/json" \
     -d '{"name": "Test"}'
   ```

## Best Practices

1. **Error Handling**
   * Always implement proper error handling in your functions
   * Return appropriate HTTP status codes
   * Include helpful error messages

2. **CORS Configuration**
   * Configure CORS for all environments (development, staging, production)
   * Use wildcards sparingly for security reasons

3. **Performance**
   * Keep functions small and focused
   * Minimize dependencies
   * Be aware of cold start times

4. **Security**
   * Use row-level security (RLS) policies
   * Validate all inputs
   * Limit function permissions

## Advanced Usage

### Environment Variables

Access environment variables in your Edge Functions:

```typescript
const apiKey = Deno.env.get("API_KEY");
```

Set environment variables in Supabase Dashboard or using CLI:

```bash
supabase secrets set API_KEY=your-secret-key
```

### Database Access

Access Supabase database from Edge Functions:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

const { data, error } = await supabase
  .from('table')
  .select('*');
```

### Scheduled Functions

Edge Functions can be scheduled to run at specific intervals using Supabase cron jobs:

```bash
supabase functions deploy-schedule cron-function --schedule "0 0 * * *"
```

## Additional Resources

* [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
* [Deno Runtime Documentation](https://deno.land/manual)
* [Edge Functions Troubleshooting Guide](./EDGE_FUNCTIONS_TROUBLESHOOTING.md)
* [Edge Functions Setup Guide](./EDGE_FUNCTIONS_SETUP.md)