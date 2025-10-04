-- Fix infinite recursion in user_profiles RLS policies
-- Drop problematic policies
DROP POLICY IF EXISTS "School admins can view school profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "School admins can update school profiles" ON public.user_profiles;

-- Recreate fixed policies without recursion
CREATE POLICY "School admins can view school profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  (get_user_school(auth.uid()) = school_id) 
  AND has_role(auth.uid(), 'school_admin'::user_role)
);

CREATE POLICY "School admins can update school profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (
  (get_user_school(auth.uid()) = school_id) 
  AND (has_role(auth.uid(), 'school_admin'::user_role) OR has_role(auth.uid(), 'super_admin'::user_role))
);

-- Create audit_logs table for tracking system events
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "School admins can view their school's audit logs"
ON public.audit_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'school_admin'::user_role)
  AND (
    -- Can see logs where the user belongs to their school
    user_id IN (
      SELECT user_id FROM public.user_profiles 
      WHERE school_id = get_user_school(auth.uid())
    )
  )
);

CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
USING (user_id = auth.uid());

-- Only system (service role) can insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    success,
    error_message,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_success,
    p_error_message,
    p_metadata
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Trigger function to log user_profiles changes
CREATE OR REPLACE FUNCTION public.audit_user_profiles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log significant changes
    IF OLD.role != NEW.role OR OLD.approval_status != NEW.approval_status OR OLD.is_active != NEW.is_active THEN
      PERFORM log_audit_event(
        auth.uid(),
        'UPDATE',
        'user_profile',
        NEW.id,
        row_to_json(OLD)::jsonb,
        row_to_json(NEW)::jsonb,
        true,
        NULL,
        jsonb_build_object('trigger', 'user_profiles_update')
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.user_id,
      'CREATE',
      'user_profile',
      NEW.id,
      NULL,
      row_to_json(NEW)::jsonb,
      true,
      NULL,
      jsonb_build_object('trigger', 'user_profiles_insert')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for user_profiles
DROP TRIGGER IF EXISTS audit_user_profiles_trigger ON public.user_profiles;
CREATE TRIGGER audit_user_profiles_trigger
AFTER INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_user_profiles_changes();

-- Trigger function to log user_roles changes
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.user_id,
      'ROLE_ASSIGNED',
      'user_role',
      NEW.id,
      NULL,
      row_to_json(NEW)::jsonb,
      true,
      NULL,
      jsonb_build_object('trigger', 'user_roles_insert', 'role', NEW.role)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      OLD.user_id,
      'ROLE_REMOVED',
      'user_role',
      OLD.id,
      row_to_json(OLD)::jsonb,
      NULL,
      true,
      NULL,
      jsonb_build_object('trigger', 'user_roles_delete', 'role', OLD.role)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for user_roles
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;
CREATE TRIGGER audit_user_roles_trigger
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.audit_user_roles_changes();