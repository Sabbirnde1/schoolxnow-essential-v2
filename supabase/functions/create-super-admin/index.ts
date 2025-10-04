import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schema
const CreateSuperAdminSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string()
    .trim()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Full name must be less than 100 characters'),
  secretKey: z.string()
    .min(8, 'Secret key must be at least 8 characters')
    .max(500, 'Secret key is too long')
});

type CreateSuperAdminRequest = z.infer<typeof CreateSuperAdminSchema>;

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`[${requestId}] Bootstrap request received`);

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const adminSecret = Deno.env.get('SUPER_ADMIN_SECRET');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Missing required environment variables`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!adminSecret) {
      console.error(`[${requestId}] SUPER_ADMIN_SECRET not configured`);
      return new Response(
        JSON.stringify({ error: 'Bootstrap secret not configured. Please contact system administrator.' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error(`[${requestId}] Invalid JSON in request body:`, error);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate input with zod
    const validationResult = CreateSuperAdminSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      console.log(`[${requestId}] Validation failed:`, errors);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { email, password, fullName, secretKey } = validationResult.data;

    // Verify secret key
    if (secretKey !== adminSecret) {
      console.log(`[${requestId}] Invalid secret key attempt for email: ${email}`);
      
      // Log failed bootstrap attempt
      await supabaseAdmin.rpc('log_audit_event', {
        p_user_id: null,
        p_action: 'BOOTSTRAP_FAILED',
        p_entity_type: 'bootstrap',
        p_success: false,
        p_error_message: 'Invalid bootstrap secret key',
        p_metadata: { email, request_id: requestId }
      });
      
      return new Response(
        JSON.stringify({ error: 'Invalid bootstrap secret key' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if super admin already exists using the database function
    console.log(`[${requestId}] Checking for existing super admin`);
    const { data: adminExists, error: checkError } = await supabaseAdmin
      .rpc('super_admin_exists');

    if (checkError) {
      console.error(`[${requestId}] Error checking for existing admin:`, checkError);
      return new Response(
        JSON.stringify({ error: 'Unable to verify admin status. Please try again.' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (adminExists) {
      console.log(`[${requestId}] Super admin already exists, rejecting request`);
      
      // Log failed bootstrap attempt
      await supabaseAdmin.rpc('log_audit_event', {
        p_user_id: null,
        p_action: 'BOOTSTRAP_FAILED',
        p_entity_type: 'bootstrap',
        p_success: false,
        p_error_message: 'Super admin already exists',
        p_metadata: { email, request_id: requestId }
      });
      
      return new Response(
        JSON.stringify({ error: 'Bootstrap already completed. A super administrator already exists.' }),
        { 
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[${requestId}] No existing super admin found, proceeding with creation`);

    // Create the auth user
    console.log(`[${requestId}] Creating auth user for email: ${email}`);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        role: 'super_admin'
      },
      email_confirm: true // Auto-confirm email
    });

    if (authError) {
      console.error(`[${requestId}] Error creating auth user:`, authError);
      
      // Provide specific error messages
      let errorMessage = 'Failed to create administrator account';
      if (authError.message?.toLowerCase().includes('already registered') || 
          authError.message?.toLowerCase().includes('already exists')) {
        errorMessage = 'An account with this email already exists';
      } else if (authError.message?.toLowerCase().includes('password')) {
        errorMessage = 'Password does not meet security requirements';
      } else if (authError.message) {
        errorMessage = authError.message;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!authData.user) {
      console.error(`[${requestId}] Auth user created but no user data returned`);
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = authData.user.id;
    console.log(`[${requestId}] Auth user created successfully: ${userId}`);

    // Log successful bootstrap start
    await supabaseAdmin.rpc('log_audit_event', {
      p_user_id: userId,
      p_action: 'BOOTSTRAP_STARTED',
      p_entity_type: 'bootstrap',
      p_success: true,
      p_metadata: { email, request_id: requestId }
    });

    // Update the user profile (approval status and active flag)
    console.log(`[${requestId}] Updating user profile for user: ${userId}`);
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        approval_status: 'approved',
        is_active: true,
        school_id: null
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error(`[${requestId}] Error updating profile:`, profileError);
      
      // Attempt rollback - delete the created user
      console.log(`[${requestId}] Attempting to rollback auth user creation`);
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.log(`[${requestId}] Rollback successful`);
      } catch (rollbackError) {
        console.error(`[${requestId}] Rollback failed:`, rollbackError);
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to initialize user profile. Please try again.' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[${requestId}] Profile updated successfully`);

    // Insert super_admin role into user_roles table
    console.log(`[${requestId}] Setting super_admin role for user: ${userId}`);
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'super_admin'
      });

    if (roleError) {
      console.error(`[${requestId}] Error setting super admin role:`, roleError);
      
      // Attempt rollback
      console.log(`[${requestId}] Attempting to rollback all changes`);
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.log(`[${requestId}] Rollback successful`);
      } catch (rollbackError) {
        console.error(`[${requestId}] Rollback failed:`, rollbackError);
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to assign administrator role. Please try again.' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[${requestId}] Super admin created successfully: ${userId}`);

    // Log successful bootstrap completion
    await supabaseAdmin.rpc('log_audit_event', {
      p_user_id: userId,
      p_action: 'BOOTSTRAP_COMPLETED',
      p_entity_type: 'bootstrap',
      p_entity_id: userId,
      p_success: true,
      p_metadata: { email, full_name: fullName, request_id: requestId }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Super admin created successfully',
        userId: userId
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error(`[${requestId}] Error name:`, error.name);
      console.error(`[${requestId}] Error message:`, error.message);
      console.error(`[${requestId}] Error stack:`, error.stack);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again or contact support.',
        requestId: requestId // Include request ID for debugging
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});