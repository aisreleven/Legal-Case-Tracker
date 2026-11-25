import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const caseService = {
  // Fetch cases based on filters and user authorization
  async getCases({ search = '', status = 'All', category = 'All', court = 'All' } = {}) {
    if (!isSupabaseConfigured) return { data: [], error: null };

    let query = supabase
      .from('cases')
      .select(`
        *,
        lawyer:profiles!cases_lawyer_id_fkey(id, full_name, email, phone, specialization),
        client:profiles!cases_client_id_fkey(id, full_name, email, phone, company)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'All') {
      query = query.eq('status', status.toLowerCase());
    }

    if (category && category !== 'All') {
      query = query.eq('case_type', category);
    }

    if (court && court !== 'All') {
      query = query.ilike('court_name', `%${court}%`);
    }

    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`case_number.ilike.%${q}%,title.ilike.%${q}%,court_name.ilike.%${q}%`);
    }

    const { data, error } = await query;
    return { data: data || [], error };
  },

  // Get a single case with related lawyer, client, hearings, and documents
  async getCaseById(id) {
    if (!isSupabaseConfigured) return { data: null, error: null };

    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        lawyer:profiles!cases_lawyer_id_fkey(id, full_name, email, phone, specialization, bar_council_id),
        client:profiles!cases_client_id_fkey(id, full_name, email, phone, company),
        hearings(*),
        documents(*),
        activities:case_activities(*)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  },

  // Create new case
  async createCase(caseData) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };

    const { data: user } = await supabase.auth.getUser();

    const payload = {
      case_number: caseData.caseNumber,
      title: caseData.title,
      description: caseData.description,
      case_type: caseData.category || caseData.case_type,
      court_name: caseData.courtName || caseData.court_name,
      court_location: caseData.courtLocation || caseData.court_location || 'Main Bench',
      courtroom: caseData.courtroom,
      judge: caseData.judge || "Hon'ble Division Bench",
      filing_date: caseData.filingDate || caseData.filing_date || new Date().toISOString().split('T')[0],
      status: (caseData.status || 'active').toLowerCase(),
      priority: (caseData.priority || 'medium').toLowerCase(),
      progress_stage: caseData.progressStage || 'Case Registration & Filing',
      progress_percent: caseData.progressPercent || 20,
      lawyer_id: caseData.lawyerId || caseData.lawyer_id || null,
      client_id: caseData.clientId || caseData.client_id || null,
      created_by: user?.user?.id || null,
    };

    const { data, error } = await supabase
      .from('cases')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      // Log activity
      await supabase.from('case_activities').insert([
        {
          case_id: data.id,
          user_id: user?.user?.id || null,
          activity_type: 'Case Registration',
          description: `Docket ${data.case_number} registered in judicial records.`,
        },
      ]);
    }

    return { data, error };
  },

  // Update existing case
  async updateCase(id, caseData) {
    if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };

    const payload = {
      title: caseData.title,
      description: caseData.description,
      case_type: caseData.category || caseData.case_type,
      court_name: caseData.courtName || caseData.court_name,
      courtroom: caseData.courtroom,
      judge: caseData.judge,
      status: caseData.status ? caseData.status.toLowerCase() : undefined,
      priority: caseData.priority ? caseData.priority.toLowerCase() : undefined,
      progress_stage: caseData.progressStage || caseData.progress_stage,
      progress_percent: caseData.progressPercent || caseData.progress_percent,
      lawyer_id: caseData.lawyerId || caseData.lawyer_id,
      client_id: caseData.clientId || caseData.client_id,
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const { data, error } = await supabase
      .from('cases')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  // Delete case (Admin only as enforced by RLS)
  async deleteCase(id) {
    if (!isSupabaseConfigured) return { error: null };
    const { error } = await supabase.from('cases').delete().eq('id', id);
    return { error };
  },

  // Get case activity log
  async getCaseActivities(caseId) {
    if (!isSupabaseConfigured) return { data: [], error: null };

    const { data, error } = await supabase
      .from('case_activities')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  // Add case activity
  async addActivity(caseId, activityType, description) {
    if (!isSupabaseConfigured) return { data: null, error: null };

    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('case_activities')
      .insert([
        {
          case_id: caseId,
          user_id: user?.user?.id || null,
          activity_type: activityType,
          description,
        },
      ])
      .select()
      .single();

    return { data, error };
  }
};
