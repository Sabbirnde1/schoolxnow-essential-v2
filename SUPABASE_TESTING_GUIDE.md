# Supabase Integration Testing Guide

This document provides a comprehensive guide to testing the Supabase integration in the SchoolXnow application. It covers all aspects of Supabase functionality including authentication, database operations, realtime subscriptions, storage, and edge functions.

## Available Test Pages

The application includes several diagnostic pages for testing Supabase functionality:

1. **Basic Supabase Test**: `/supabase-test`
   - Simple connection test
   - Basic CRUD operations

2. **Realtime Test**: `/realtime-test`
   - Tests realtime subscriptions
   - Monitors connection status
   - Tests subscription manager

3. **Complete Test Suite**: `/supabase-test-suite`
   - Comprehensive testing of all Supabase features
   - Configurable test parameters
   - Detailed logging and status monitoring

## Features Tested in the Comprehensive Suite

### 1. Connection Testing
- API connectivity check
- Health status verification
- Latency measurement
- Configuration validation

### 2. Authentication
- User sign up
- User sign in
- Session management
- User profile retrieval
- Sign out functionality

### 3. Database
- Table queries
- Record counting
- Data retrieval
- Error handling

### 4. Realtime
- Channel creation
- Event subscription
- Event reception
- Subscription cleanup
- Status monitoring

### 5. Storage
- Bucket listing
- File listing
- Storage permissions

### 6. Edge Functions
- Function invocation
- Error handling
- Response processing

## Using the Test Suite

### Test Configuration
You can configure the following parameters:
- **Test User Email**: Email for authentication tests
- **Test User Password**: Password for authentication tests
- **Test Table**: Database table to use for query and realtime tests

### Running Tests
1. **Individual Feature Tests**: Click on a tab and then the corresponding test button
2. **Complete Test Suite**: Click "Run All Tests" to test all features in sequence

### Test Logs
The test suite provides detailed logs showing:
- Test operations being performed
- Success or failure of operations
- Detailed error messages
- Response data samples

## Interpreting Results

### Connection Test
- **Success**: Shows "Connection healthy!" and latency
- **Failure**: Shows specific connection error

### Authentication Test
- **Success**: Shows successful sign in with user ID
- **Failure**: Shows auth error message

### Database Test
- **Success**: Shows record count and sample data
- **Failure**: Shows query error

### Realtime Test
- **Success**: Shows "Realtime subscription active"
- **Events**: Shows received events when database changes
- **Failure**: Shows subscription error

### Storage Test
- **Success**: Shows available buckets and files
- **Failure**: Shows storage access error

### Functions Test
- **Success**: Shows function response
- **Not Found**: Shows that function isn't deployed (expected if not set up)
- **Failure**: Shows invocation error

## Troubleshooting Common Issues

### Connection Issues
- Check `.env` file for correct Supabase URL and API key
- Verify network connectivity
- Check Supabase project status in dashboard

### Authentication Issues
- Verify that the test user exists or can be created
- Check email confirmation settings
- Check auth permissions in Supabase dashboard

### Database Issues
- Check RLS policies for the test table
- Verify schema exists
- Check that the table name is correct

### Realtime Issues
- Enable realtime for the table in Supabase dashboard
- Check that RLS policies allow realtime
- Verify WebSocket connectivity

### Storage Issues
- Create a storage bucket if none exists
- Check storage permissions
- Verify public/private bucket settings

### Functions Issues
- Deploy a test function named 'hello-world' if needed
- Check function logs in Supabase dashboard
- Verify function permissions

## Security Considerations

- The test suite should only be enabled in development or staging environments
- Remove or disable the test routes in production
- Use test accounts with limited permissions
- Don't use production data for testing

## Adding Custom Tests

To extend the test suite:

1. Add a new tab in the `SupabaseTestSuite.tsx` component
2. Create a test function that follows the pattern of existing tests
3. Add appropriate logging and error handling
4. Connect the function to a button in the UI
5. Update this documentation with details about the new test

## Technical Implementation

The test suite is implemented in React and uses:
- React hooks for state management
- Supabase JS client for API interactions
- Toast notifications for feedback
- Tailwind CSS and ShadcnUI for styling
- Error boundary for crash protection