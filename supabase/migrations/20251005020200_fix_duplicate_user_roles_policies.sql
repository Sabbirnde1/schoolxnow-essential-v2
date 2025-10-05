-- Migration: Fix duplicate user_roles policies
-- This resolves the "Multiple Permissive Policies" warning from Supabase

-- Drop ALL existing policies on user_roles table (including any new ones)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_super_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_super_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_super_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_super_admin" ON public.user_roles;

-- Recreate policies with clear, non-overlapping permissions
-- Policy 1: Users can view their own roles (most restrictive)
CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Policy 2: Super admins can view all roles
CREATE POLICY "user_roles_select_super_admin"
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'super_admin')
  AND user_id != auth.uid()  -- Don't overlap with user's own role policy
);

-- Policy 3: Super admins can insert new roles
CREATE POLICY "user_roles_insert_super_admin"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Policy 4: Super admins can update roles
CREATE POLICY "user_roles_update_super_admin"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Policy 5: Super admins can delete roles
CREATE POLICY "user_roles_delete_super_admin"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));
