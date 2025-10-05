-- Script to check all RLS policies in the database
-- Run this in Supabase SQL Editor to see all current policies

-- 1. Check all policies on user_roles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- 2. Check for duplicate or overlapping policies across all tables
SELECT 
    tablename,
    COUNT(*) as policy_count,
    COUNT(DISTINCT cmd) as unique_commands,
    array_agg(DISTINCT policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 3
ORDER BY policy_count DESC;

-- 3. Check for permissive policies that might overlap
SELECT 
    tablename,
    policyname,
    cmd as command,
    permissive,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND permissive = 'PERMISSIVE'
ORDER BY tablename, cmd;
