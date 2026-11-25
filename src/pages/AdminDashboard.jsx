import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  FileText,
  Activity,
  ArrowUpRight,
  UserCheck,
  Building2,
  Scale,
  RefreshCw,
  Inbox
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { reportService } from '../services/reportService';

const formatActivityTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reportService.getAdminDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard statistics from Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-[#142B4A] via-[#1D3B63] to-[#24466B] p-6 rounded-2xl text-white shadow-card flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[#C6A15B] text-xs font-semibold mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>Master Judicial Registry Control</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Administrator Operations Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Synchronizing live docket statistics from Supabase...
            </p>
          </div>
        </div>

        <div className="min-h-[340px] bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8">
          <div className="w-10 h-10 border-4 border-[#142B4A]/20 border-t-[#142B4A] dark:border-[#C6A15B]/20 dark:border-t-[#C6A15B] rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Loading Live Judicial Metrics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-[#142B4A] via-[#1D3B63] to-[#24466B] p-6 rounded-2xl text-white shadow-card">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[#C6A15B] text-xs font-semibold mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Master Judicial Registry Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Administrator Operations Center
          </h1>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                Failed to Load Dashboard Data
              </h2>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#142B4A] hover:bg-[#24466B] text-white text-xs font-bold rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalUsers: 0,
    totalLawyers: 0,
    totalClients: 0,
    totalAdmins: 0,
    totalCases: 0,
    activeCases: 0,
    pendingCases: 0,
    completedCases: 0,
    upcomingHearingsCount: 0,
  };

  const monthlyAnalytics = dashboardData?.monthlyAnalytics || [];
  const peakMonth = dashboardData?.peakMonth || null;
  const upcomingHearings = dashboardData?.upcomingHearings || [];
  const recentCases = dashboardData?.recentCases || [];
  const recentDocuments = dashboardData?.recentDocuments || [];
  const recentActivities = dashboardData?.recentActivities || [];

  const doughnutData = [
    { name: 'Active Cases', value: stats.activeCases, color: '#142B4A' },
    { name: 'Pending Cases', value: stats.pendingCases, color: '#C6A15B' },
    { name: 'Completed Cases', value: stats.completedCases, color: '#10B981' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#142B4A] via-[#1D3B63] to-[#24466B] p-6 rounded-2xl text-white shadow-card">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[#C6A15B] text-xs font-semibold mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Master Judicial Registry Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Administrator Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time docket surveillance, hearing calendars, and legal compliance analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadDashboardData}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
            title="Refresh live statistics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/cases/new')}
            className="px-4 py-2 bg-[#C6A15B] hover:bg-[#B08B42] text-white text-xs font-bold rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            + Register Case
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all"
          >
            Cause Calendar
          </button>
        </div>
      </div>

      {/* 6 Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Cases"
          value={stats.totalCases}
          subtitle="All filed dockets"
          icon={Briefcase}
          onClick={() => navigate('/cases')}
          accentColor="primary"
        />
        <StatCard
          title="Active Cases"
          value={stats.activeCases}
          subtitle="Under trial/hearing"
          icon={Activity}
          onClick={() => navigate('/cases')}
          accentColor="gold"
        />
        <StatCard
          title="Pending Cases"
          value={stats.pendingCases}
          subtitle="Awaiting evidence"
          icon={AlertCircle}
          onClick={() => navigate('/cases')}
          accentColor="amber"
        />
        <StatCard
          title="Completed Cases"
          value={stats.completedCases}
          subtitle="Disposed & decreed"
          icon={CheckCircle2}
          onClick={() => navigate('/cases')}
          accentColor="emerald"
        />
        <StatCard
          title="Upcoming Hearings"
          value={stats.upcomingHearingsCount}
          subtitle="Scheduled appearances"
          icon={Calendar}
          onClick={() => navigate('/hearings')}
          accentColor="rose"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`${stats.totalLawyers} lawyers · ${stats.totalClients} clients`}
          icon={Users}
          onClick={() => navigate('/users')}
          accentColor="primary"
        />
      </div>

      {/* Charts Section: Case Overview & Registration Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Case Overview Doughnut Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Case Overview Status</h2>
              <p className="text-xs text-slate-500">Distribution across active, pending and completed</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Live Docket
            </span>
          </div>

          <div className="h-64 w-full mt-2">
            {doughnutData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <Inbox className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-semibold">No cases recorded yet</p>
                <p className="text-[11px] mt-0.5">Register a case to view status distribution.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={doughnutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {doughnutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#142B4A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] font-medium text-slate-400 block">Active</span>
              <span className="text-sm font-bold text-[#142B4A] dark:text-white">{stats.activeCases}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20">
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 block">Pending</span>
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{stats.pendingCases}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20">
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 block">Completed</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{stats.completedCases}</span>
            </div>
          </div>
        </div>

        {/* Case Registration Analytics Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Case Registration Analytics</h2>
              <p className="text-xs text-slate-500">Monthly breakdown of new case admissions vs completed</p>
            </div>
            <span className="text-xs font-semibold text-[#C6A15B]">Live Filings</span>
          </div>

          <div className="h-64 w-full mt-2">
            {stats.totalCases === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <Inbox className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-semibold">No case filings available</p>
                <p className="text-[11px] mt-0.5">Monthly analytics will populate once cases are filed.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#142B4A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={30}
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{val}</span>}
                  />
                  <Bar dataKey="newCases" name="New Filings" fill="#142B4A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolvedCases" name="Completed" fill="#C6A15B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              {peakMonth ? (
                <>Peak Month: <strong>{peakMonth.fullMonth} ({peakMonth.newCases} {peakMonth.newCases === 1 ? 'filing' : 'filings'})</strong></>
              ) : (
                'No monthly filings recorded yet'
              )}
            </span>
            <button
              onClick={() => navigate('/reports')}
              className="text-[#142B4A] dark:text-gold font-bold hover:underline"
            >
              Detailed Reports →
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Upcoming Hearings & User Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Hearings */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Upcoming Hearings</h2>
              <p className="text-xs text-slate-500">Scheduled appearances before court benches</p>
            </div>
            <button
              onClick={() => navigate('/hearings')}
              className="text-xs font-semibold text-[#142B4A] dark:text-gold hover:underline flex items-center gap-1"
            >
              <span>View All Hearings</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingHearings.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center text-slate-400">
              <Calendar className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-semibold">No upcoming hearings scheduled</p>
              <p className="text-[11px] mt-0.5">Scheduled future hearings will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5 font-bold">Case #</th>
                    <th className="pb-2.5 font-bold">Title</th>
                    <th className="pb-2.5 font-bold">Court / Room</th>
                    <th className="pb-2.5 font-bold">Date & Time</th>
                    <th className="pb-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {upcomingHearings.map((h) => (
                    <tr
                      key={h.id}
                      onClick={() => navigate(`/cases/${h.caseId}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-bold text-[#142B4A] dark:text-gold">{h.caseNumber}</td>
                      <td className="py-3 font-medium max-w-[200px] truncate">{h.caseTitle}</td>
                      <td className="py-3 text-slate-500 truncate">{h.courtName} ({h.courtroom})</td>
                      <td className="py-3">
                        <span className="font-semibold">{h.hearingDate}</span>
                        <span className="text-[10px] text-slate-400 block">{h.hearingTime}</span>
                      </td>
                      <td className="py-3"><StatusBadge status={h.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Overview Section */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">User Overview</h2>
                <p className="text-xs text-slate-500">Platform credential governance</p>
              </div>
              <button
                onClick={() => navigate('/users')}
                className="text-xs font-semibold text-[#142B4A] dark:text-gold hover:underline"
              >
                Manage →
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#C6A15B]/15 text-[#B08B42] rounded-lg">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#142B4A] dark:text-white">Total Lawyers</h3>
                    <p className="text-[10px] text-slate-400">Registered advocates</p>
                  </div>
                </div>
                <span className="text-base font-bold text-[#142B4A] dark:text-white">
                  {stats.totalLawyers}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#142B4A] dark:text-white">Total Clients</h3>
                    <p className="text-[10px] text-slate-400">Litigants & corporations</p>
                  </div>
                </div>
                <span className="text-base font-bold text-[#142B4A] dark:text-white">
                  {stats.totalClients}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-sky-300 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#142B4A] dark:text-white">Administrators</h3>
                    <p className="text-[10px] text-slate-400">Registry controllers</p>
                  </div>
                </div>
                <span className="text-base font-bold text-[#142B4A] dark:text-white">
                  {stats.totalAdmins}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => navigate('/users')}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-[#142B4A] hover:text-white rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all"
            >
              Manage User Accounts
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Cases, Recent Documents & Activity Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Recently Updated Cases</h2>
            <button onClick={() => navigate('/cases')} className="text-xs text-[#C6A15B] font-semibold hover:underline">
              All Cases
            </button>
          </div>
          {recentCases.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
              <Briefcase className="w-6 h-6 mb-1.5 opacity-50" />
              <p className="text-xs font-semibold">No cases found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#142B4A] dark:text-gold">{c.caseNumber}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">{c.title}</h4>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                    <span>{c.assignedLawyer}</span>
                    <span>Filing: {c.filingDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Recent Documents</h2>
            <button onClick={() => navigate('/documents')} className="text-xs text-[#C6A15B] font-semibold hover:underline">
              Repository
            </button>
          </div>
          {recentDocuments.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
              <FileText className="w-6 h-6 mb-1.5 opacity-50" />
              <p className="text-xs font-semibold">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate('/documents')}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-sky-300 rounded-lg">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>{doc.category}</span>
                        <span>{doc.fileSize}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Recent Activities</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Case Trail</span>
          </div>
          {recentActivities.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
              <Activity className="w-6 h-6 mb-1.5 opacity-50" />
              <p className="text-xs font-semibold">No case activities logged yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => act.caseId && navigate(`/cases/${act.caseId}`)}
                  className={`flex items-start gap-2.5 text-xs ${act.caseId ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-1.5 -mx-1.5 rounded-lg transition-colors' : ''}`}
                >
                  <div className="w-2 h-2 rounded-full bg-[#C6A15B] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      <span className="text-[#142B4A] dark:text-gold">{act.actorName}</span>{' '}
                      <span className="text-slate-500 dark:text-slate-400 font-normal">· {act.activityType}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {act.caseNumber ? `${act.caseNumber}: ` : ''}{act.description}
                    </p>
                    <span className="text-[10px] text-slate-400">{formatActivityTime(act.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
