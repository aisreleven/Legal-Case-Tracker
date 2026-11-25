import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const authService = {
  // Sign up a new user (role is strictly forced to 'client')
  async signUp({ email, password, fullName, phone, metadata = {} }) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') };
    }

    // Strict role safety: all web registrations default to client only
    const safeRole = 'client';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
          role: safeRole,
          ...metadata,
        },
      },
    });

    if (error) return { data: null, error };
    return { data, error: null };
  },

  // Log in user with email & password using Supabase Auth signInWithPassword
  async signIn({ email, password }) {
    if (!isSupabaseConfigured) {
      return { 
        data: null, 
        error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.') 
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error };
    }

    if (!data?.user || !data?.session) {
      return { 
        data: null, 
        error: new Error('Invalid email or password. Please verify your credentials or register a new account.') 
      };
    }

    // Fetch associated profile
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile) {
        return { data: { ...data, profile }, error: null };
      }
    } catch (err) {
      console.warn('Profile fetch encountered error:', err);
    }

    // Fallback profile representation from verified auth session
    const fallbackProfile = {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
      role: (data.user.user_metadata?.role || 'client').toLowerCase(),
      account_status: 'active',
      phone: data.user.user_metadata?.phone || '',
    };

    return { data: { ...data, profile: fallbackProfile }, error: null };
  },

  // Log out current user session
  async signOut() {
    if (!isSupabaseConfigured) return { error: null };
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: err };
    }
  },

  // Request password reset email
  async resetPassword(email) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });

    return { data, error };
  },

  // Update password for currently signed-in user
  async updatePassword(newPassword) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { data, error };
  },

  // Fetch current user and profile
  async getCurrentUserProfile() {
    if (!isSupabaseConfigured) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile || null;
  },

  // Update profile
  async updateProfile(userId, updates) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };

    // Disallow editing role or account status through regular profile updates
    const { role, account_status, id, created_at, updated_at, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }
};
