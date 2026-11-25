import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const userService = {
  // Get all registered users (for Admin) or directory
  async getUsers({ search = '', role = 'All' } = {}) {
    if (!isSupabaseConfigured) return { data: [], error: null };

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (role && role !== 'All') {
      query = query.eq('role', role.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
    }

    const { data, error } = await query;
    return { data: data || [], error };
  },

  // Toggle user status (active <-> suspended)
  async toggleUserStatus(userId, currentStatus) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };

    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    const { data, error } = await supabase
      .from('profiles')
      .update({ account_status: newStatus })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Update user profile details
  async updateUser(userId, updates) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };

    const payload = {
      full_name: updates.fullName || updates.full_name,
      phone: updates.phone,
      specialization: updates.specialization,
      department: updates.department,
      company: updates.company,
      bio: updates.bio,
      profile_image: updates.avatar || updates.profile_image,
      account_status: updates.status ? updates.status.toLowerCase() : undefined,
      role: updates.role ? updates.role.toLowerCase() : undefined,
    };

    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Delete user (Admin only)
  async deleteUser(userId) {
    if (!isSupabaseConfigured) return { error: null };

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    return { error };
  }
};
