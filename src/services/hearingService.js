import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const hearingService = {
  // Get all hearings with associated case information
  async getHearings({ search = '', status = 'All', date = '' } = {}) {
    if (!isSupabaseConfigured) return { data: [], error: null };

    let query = supabase
      .from('hearings')
      .select(`
        *,
        case:cases!hearings_case_id_fkey(
          id,
          case_number,
          title,
          court_name,
          status,
          lawyer:profiles!cases_lawyer_id_fkey(id, full_name),
          client:profiles!cases_client_id_fkey(id, full_name)
        )
      `)
      .order('hearing_date', { ascending: true });

    if (status && status !== 'All') {
      query = query.eq('status', status.toLowerCase());
    }

    if (date) {
      query = query.gte('hearing_date', date);
    }

    const { data, error } = await query;
    return { data: data || [], error };
  },

  // Get upcoming hearings
  async getUpcomingHearings(limit = 10) {
    if (!isSupabaseConfigured) return { data: [], error: null };

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('hearings')
      .select(`
        *,
        case:cases!hearings_case_id_fkey(
          id,
          case_number,
          title,
          court_name,
          lawyer:profiles!cases_lawyer_id_fkey(id, full_name),
          client:profiles!cases_client_id_fkey(id, full_name)
        )
      `)
      .gte('hearing_date', today)
      .eq('status', 'scheduled')
      .order('hearing_date', { ascending: true })
      .limit(limit);

    return { data: data || [], error };
  },

  // Create new hearing
  async createHearing(hearingData) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };

    const payload = {
      case_id: hearingData.caseId || hearingData.case_id,
      hearing_date: hearingData.hearingDate || hearingData.hearing_date,
      hearing_time: hearingData.hearingTime || hearingData.hearing_time,
      court_name: hearingData.courtName || hearingData.court_name,
      courtroom: hearingData.courtroom,
      hearing_type: hearingData.hearingType || hearingData.hearing_type,
      description: hearingData.notes || hearingData.description,
      status: (hearingData.status || 'scheduled').toLowerCase(),
      outcome: hearingData.outcome || 'Awaiting hearing date',
    };

    const { data, error } = await supabase
      .from('hearings')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      // Create activity entry
      await supabase.from('case_activities').insert([
        {
          case_id: payload.case_id,
          activity_type: 'Hearing Scheduled',
          description: `Hearing scheduled for ${payload.hearing_date} at ${payload.hearing_time} (${payload.hearing_type}).`,
        },
      ]);
    }

    return { data, error };
  },

  // Update hearing
  async updateHearing(id, hearingData) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };

    const payload = {
      hearing_date: hearingData.hearingDate || hearingData.hearing_date,
      hearing_time: hearingData.hearingTime || hearingData.hearing_time,
      court_name: hearingData.courtName || hearingData.court_name,
      courtroom: hearingData.courtroom,
      hearing_type: hearingData.hearingType || hearingData.hearing_type,
      description: hearingData.notes || hearingData.description,
      status: hearingData.status ? hearingData.status.toLowerCase() : undefined,
      outcome: hearingData.outcome,
      next_hearing_date: hearingData.nextHearingDate || hearingData.next_hearing_date,
    };

    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const { data, error } = await supabase
      .from('hearings')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  // Reschedule hearing
  async rescheduleHearing(id, newDate, newTime, notes, status = 'scheduled') {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };

    const { data, error } = await supabase
      .from('hearings')
      .update({
        hearing_date: newDate,
        hearing_time: newTime,
        description: notes,
        status: status.toLowerCase(),
      })
      .eq('id', id)
      .select('*, case:cases(id, case_number)')
      .single();

    if (!error && data?.case_id) {
      // Activity
      await supabase.from('case_activities').insert([
        {
          case_id: data.case_id,
          activity_type: 'Hearing Rescheduled',
          description: `Hearing rescheduled to ${newDate} at ${newTime}. Note: ${notes || 'No note'}`,
        },
      ]);
    }

    return { data, error };
  },

  // Delete hearing
  async deleteHearing(id) {
    if (!isSupabaseConfigured) return { error: null };
    const { error } = await supabase.from('hearings').delete().eq('id', id);
    return { error };
  }
};
