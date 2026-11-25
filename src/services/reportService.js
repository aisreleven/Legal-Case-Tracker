import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const reportService = {
  // Aggregate real stats from PostgreSQL for reports
  async getDashboardAnalytics() {
    if (!isSupabaseConfigured) return null;

    // 1. Fetch cases
    const { data: casesData, error: casesError } = await supabase
      .from('cases')
      .select('id, status, case_type, filing_date, created_at');

    if (casesError) return null;

    // 2. Fetch hearings
    const { data: hearingsData } = await supabase
      .from('hearings')
      .select('id, status, hearing_date');

    const totalCases = casesData?.length || 0;
    const activeCases = casesData?.filter(c => c.status === 'active').length || 0;
    const pendingCases = casesData?.filter(c => c.status === 'pending').length || 0;
    const closedCases = casesData?.filter(c => c.status === 'closed').length || 0;

    // Cases by category aggregation
    const categoryMap = {};
    casesData?.forEach(c => {
      const type = c.case_type || 'Other';
      categoryMap[type] = (categoryMap[type] || 0) + 1;
    });

    const categoryStats = Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key],
    }));

    // Status stats
    const statusStats = [
      { name: 'Active Cases', value: activeCases, color: '#142B4A' },
      { name: 'Pending Hearings', value: pendingCases, color: '#C6A15B' },
      { name: 'Closed Cases', value: closedCases, color: '#10B981' },
    ];

    // Monthly analytics calculation
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};

    monthNames.forEach(m => {
      monthlyMap[m] = { month: m, newCases: 0, resolvedCases: 0, hearings: 0 };
    });

    casesData?.forEach(c => {
      if (c.filing_date) {
        const d = new Date(c.filing_date);
        const m = monthNames[d.getMonth()];
        if (monthlyMap[m]) {
          monthlyMap[m].newCases += 1;
          if (c.status === 'closed') monthlyMap[m].resolvedCases += 1;
        }
      }
    });

    hearingsData?.forEach(h => {
      if (h.hearing_date) {
        const d = new Date(h.hearing_date);
        const m = monthNames[d.getMonth()];
        if (monthlyMap[m]) {
          monthlyMap[m].hearings += 1;
        }
      }
    });

    const monthlyAnalytics = Object.values(monthlyMap);

    return {
      totalCases,
      activeCases,
      pendingCases,
      closedCases,
      statusStats,
      categoryStats,
      monthlyAnalytics,
    };
  },

  // Fetch complete live Admin Dashboard statistics, upcoming hearings, recent records & activities
  async getAdminDashboardData() {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please verify your environment variables.');
    }

    const today = new Date().toISOString().split('T')[0];

    const [
      profilesRes,
      casesRes,
      hearingsRes,
      documentsRes,
      activitiesRes,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, role, account_status'),
      supabase
        .from('cases')
        .select(`
          id,
          case_number,
          title,
          status,
          filing_date,
          created_at,
          updated_at,
          lawyer:profiles!cases_lawyer_id_fkey(id, full_name)
        `)
        .order('updated_at', { ascending: false }),
      supabase
        .from('hearings')
        .select(`
          id,
          case_id,
          hearing_date,
          hearing_time,
          court_name,
          courtroom,
          status,
          case:cases!hearings_case_id_fkey(id, case_number, title)
        `)
        .gte('hearing_date', today)
        .eq('status', 'scheduled')
        .order('hearing_date', { ascending: true }),
      supabase
        .from('documents')
        .select('id, document_name, document_type, file_size, created_at')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('case_activities')
        .select(`
          id,
          case_id,
          user_id,
          activity_type,
          description,
          created_at,
          actor:profiles(id, full_name, role),
          case:cases(id, case_number, title)
        `)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const firstError =
      profilesRes.error ||
      casesRes.error ||
      hearingsRes.error ||
      documentsRes.error ||
      activitiesRes.error;

    if (firstError) {
      throw new Error(firstError.message || 'Failed to fetch dashboard data from Supabase.');
    }

    const profiles = profilesRes.data || [];
    const cases = casesRes.data || [];
    const upcomingHearings = hearingsRes.data || [];
    const recentDocuments = documentsRes.data || [];
    const recentActivities = activitiesRes.data || [];

    // User counts by role
    const totalUsers = profiles.length;
    const totalLawyers = profiles.filter((p) => p.role?.toLowerCase() === 'lawyer').length;
    const totalClients = profiles.filter((p) => p.role?.toLowerCase() === 'client').length;
    const totalAdmins = profiles.filter((p) => p.role?.toLowerCase() === 'admin').length;

    // Case counts by status
    const totalCases = cases.length;
    const activeCases = cases.filter((c) => c.status?.toLowerCase() === 'active').length;
    const pendingCases = cases.filter((c) => c.status?.toLowerCase() === 'pending').length;
    const completedCases = cases.filter((c) => c.status?.toLowerCase() === 'closed').length;

    // Monthly case registration analytics from actual filing_date / created_at
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthlyMap = monthNames.map((m, idx) => ({
      month: m,
      fullMonth: fullMonthNames[idx],
      newCases: 0,
      resolvedCases: 0,
    }));

    cases.forEach((c) => {
      const dateStr = c.filing_date || c.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return;
      const idx = d.getMonth();
      if (monthlyMap[idx]) {
        monthlyMap[idx].newCases += 1;
        if (c.status?.toLowerCase() === 'closed') {
          monthlyMap[idx].resolvedCases += 1;
        }
      }
    });

    const peakMonthEntry = monthlyMap.reduce(
      (best, cur) => (cur.newCases > best.newCases ? cur : best),
      { fullMonth: '', newCases: 0 }
    );

    return {
      stats: {
        totalUsers,
        totalLawyers,
        totalClients,
        totalAdmins,
        totalCases,
        activeCases,
        pendingCases,
        completedCases,
        upcomingHearingsCount: upcomingHearings.length,
      },
      monthlyAnalytics: monthlyMap,
      peakMonth: peakMonthEntry.newCases > 0 ? peakMonthEntry : null,
      upcomingHearings: upcomingHearings.slice(0, 5).map((h) => ({
        id: h.id,
        caseId: h.case_id,
        caseNumber: h.case?.case_number || 'N/A',
        caseTitle: h.case?.title || 'Untitled Case',
        courtName: h.court_name,
        courtroom: h.courtroom || 'Main Bench',
        hearingDate: h.hearing_date,
        hearingTime: h.hearing_time,
        status: h.status ? h.status.charAt(0).toUpperCase() + h.status.slice(1) : 'Scheduled',
      })),
      recentCases: cases.slice(0, 4).map((c) => ({
        id: c.id,
        caseNumber: c.case_number,
        title: c.title,
        status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Active',
        assignedLawyer: c.lawyer?.full_name || 'Unassigned',
        filingDate: c.filing_date,
      })),
      recentDocuments: recentDocuments.map((d) => ({
        id: d.id,
        title: d.document_name,
        category: d.document_type,
        fileSize: d.file_size || '—',
      })),
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        caseId: a.case_id,
        actorName: a.actor?.full_name || 'System',
        activityType: a.activity_type,
        description: a.description,
        caseNumber: a.case?.case_number || '',
        createdAt: a.created_at,
      })),
    };
  },
};
