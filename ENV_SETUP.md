# Environment Variables Setup Guide

## Overview
This project uses environment variables to securely manage configuration settings, particularly for Supabase integration.

## Quick Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your Supabase credentials:**
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to Settings > API
   - Copy the following values:
     - `Project URL` → `VITE_SUPABASE_URL`
     - `anon/public key` → `VITE_SUPABASE_ANON_KEY`

3. **Update the .env file with your values:**
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public API key | Yes | `eyJhbG...` |

## Security Best Practices

### ✅ DO:
- Keep your `.env` file in `.gitignore`
- Use `.env.example` as a template for other developers
- Rotate API keys if they are accidentally exposed
- Use different Supabase projects for development and production
- Share credentials securely (never via email or chat)

### ❌ DON'T:
- Commit `.env` files to version control
- Share your `.env` file publicly
- Use production credentials in development
- Hardcode sensitive values in source code

## Configuration Debug Page

For easy troubleshooting, visit the **Configuration Debug Page**:

1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:8080/config-debug`
3. View detailed configuration status and diagnostics

This page will show you:
- ✅ Configuration validation status
- ❌ Any errors with your environment variables
- ⚠️  Warnings about potential issues
- 📊 Current configuration values
- 🔧 Step-by-step fix instructions

## Troubleshooting

### Error: "Missing VITE_SUPABASE_URL environment variable"
**Solution:** Make sure you have a `.env` file in the root directory with the `VITE_SUPABASE_URL` variable set.

**Quick Debug:** Visit `/config-debug` for detailed diagnostics.

### Error: "Missing VITE_SUPABASE_ANON_KEY environment variable"
**Solution:** Make sure your `.env` file contains the `VITE_SUPABASE_ANON_KEY` variable with your Supabase anonymous key.

**Quick Debug:** Visit `/config-debug` for detailed diagnostics.

### Error: "Invalid URL format" or "Invalid API key format"
**Solution:** Check that your URL is a valid HTTPS URL and your API key is a JWT token (starts with "eyJ").

**Quick Debug:** Run diagnostics in console or visit `/config-debug`.

### Changes to .env not reflecting
**Solution:** Restart your development server. Vite only reads environment variables at startup.

```bash
npm run dev
```

### Environment variables showing as undefined
**Solution:** Make sure your variable names start with `VITE_`. Only variables prefixed with `VITE_` are exposed to the client-side code in Vite projects.

### Placeholder values detected
**Solution:** Make sure you replaced the placeholder values in `.env` with your actual Supabase credentials. Don't use values like "your-project-id" or "example".

## Development vs Production

For different environments, you can create separate env files:

- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env.local` - Local overrides (not committed)

Vite will automatically load the correct file based on the mode.

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Documentation](https://supabase.com/docs)
- [Environment Variables Best Practices](https://12factor.net/config)

## Support

If you encounter any issues with environment configuration, please:
1. Check this guide first
2. Verify your `.env` file format
3. Ensure you've restarted the dev server
4. Contact the development team if issues persist
