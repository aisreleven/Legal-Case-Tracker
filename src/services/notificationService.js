import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const notificationService = {
  // Get notifications for current authenticated user
  async getNotifications() {
    if (!isSupabaseConfigured) return { data: [], error: null };

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return { data: [], error: null };

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  // Mark single notification as read
  async markAsRead(id) {
    if (!isSupabaseConfigured) return { error: null };

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    return { error };
  },

  // Mark all notifications as read for current user
  async markAllAsRead() {
    if (!isSupabaseConfigured) return { error: null };

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return { error: null };

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.user.id)
      .eq('is_read', false);

    return { error };
  },

  // Delete notification
  async deleteNotification(id) {
    if (!isSupabaseConfigured) return { error: null };

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    return { error };
  },

  // Create notification
  async createNotification({ userId, title, message, type = 'system', caseId = null, link = null }) {
    if (!isSupabaseConfigured) return { data: null, error: null };

    const payload = {
      user_id: userId,
      title,
      message,
      notification_type: type,
      related_case_id: caseId,
      link,
      is_read: false,
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select()
      .single();

    return { data, error };
  }
};
