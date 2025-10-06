# Fix Teacher Student Insert Issue - Instructions

## Problem
Teachers cannot add new students due to missing RLS (Row Level Security) policies.

## Solution
Apply the migration file to add proper RLS policies for teachers.

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of this file:
   `supabase/migrations/20251006000001_fix_teacher_student_insert.sql`
5. Click **Run** to execute the migration
6. Verify success message appears

### Option 2: Using Supabase CLI

1. Login to Supabase:
   ```powershell
   npx supabase login
   ```

2. Link your project (if not already linked):
   ```powershell
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Push the migration:
   ```powershell
   npx supabase db push
   ```

## What This Fix Does

The migration adds proper RLS policies that:

✅ Allow **teachers** to:
- View students in their school
- Add new students to their school  
- Update student information
  
✅ Allow **school admins** to:
- View students in their school
- Add new students
- Update student information
- Delete students

✅ Allow **super admins** to:
- Manage all students across all schools

## Testing After Fix

1. Log in as a teacher
2. Go to Student Management
3. Click "Add New Student"
4. Fill in the form
5. Submit - should work without errors

## Files Modified
- `supabase/migrations/20251006000001_fix_teacher_student_insert.sql` (NEW)

## Notes
- This fix is backward compatible
- Existing data is not affected
- Only permissions are updated
