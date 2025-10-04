import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  school_id: string | null;
  role: 'super_admin' | 'school_admin' | 'teacher';
  full_name: string;
  full_name_bangla: string | null;
  phone: string | null;
  address: string | null;
  address_bangla: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  approval_status: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: string, schoolId?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Fetch user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (roleError) {
        console.error('Error fetching role:', roleError);
        return;
      }
      
      // Combine profile data with role
      if (profileData && roleData) {
        setProfile({
          ...profileData,
          role: roleData.role
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, clearing session');
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // Handle signed out or token expired
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid potential auth state conflicts
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session with error handling
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // If there's an error getting the session, try to refresh
          if (error.message?.includes('refresh')) {
            console.log('Attempting to recover from refresh token error');
            await supabase.auth.refreshSession();
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        // Clear potentially corrupted session data
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    // Set up real-time subscriptions for profile and role changes
    let profileSubscription: any = null;
    
    const setupProfileSubscription = (userId: string) => {
      profileSubscription = supabase
        .channel('profile-and-role-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_profiles',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('User profile change detected:', payload);
            // Refetch profile to get updated role
            fetchProfile(userId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_roles',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('User role change detected:', payload);
            // Refetch profile to get updated role
            fetchProfile(userId);
          }
        )
        .subscribe();
    };

    if (user?.id) {
      setupProfileSubscription(user.id);
    }

    return () => {
      subscription.unsubscribe();
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle specific auth errors with better messages
        if (error.message?.includes('refresh')) {
          return { error: { ...error, message: 'Session expired. Please try logging in again.' } };
        }
        if (error.message?.includes('Invalid login credentials')) {
          return { error: { ...error, message: 'Invalid email or password. Please check your credentials.' } };
        }
      }
      
      return { error };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: { message: 'An unexpected error occurred. Please try again.' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role?: string, schoolId?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role || 'teacher',
          school_id: schoolId || null,
        },
      },
    });
    
    // If signup is successful and user is immediately confirmed (no email verification required)
    if (data.user && !error && role === 'super_admin') {
      // For super admin, update the profile and role immediately after creation
      try {
        // Update profile
        await supabase
          .from('user_profiles')
          .update({
            approval_status: 'approved',
            is_active: true,
            school_id: null
          })
          .eq('user_id', data.user.id);
        
        // Ensure role is set in user_roles table
        await supabase
          .from('user_roles')
          .upsert({
            user_id: data.user.id,
            role: 'super_admin'
          });
      } catch (updateError) {
        console.error('Error updating super admin profile:', updateError);
      }
    }
    
    if (data.user && !error && role !== 'super_admin') {
      // The profile will be created automatically by the handle_new_user trigger
      console.log('User signed up successfully:', data.user.id);
    }
    
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Always clear local state, even if signOut fails
      setUser(null);
      setSession(null);
      setProfile(null);
      
      if (error && !error.message?.includes('refresh')) {
        console.error('Sign out error:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Still clear local state on error
      setUser(null);
      setSession(null);
      setProfile(null);
      return { error: null }; // Don't block user from "signing out" locally
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}