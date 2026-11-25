import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  Briefcase,
  Clock,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useApp } from '../context/AppContext';
import {
  monthlyCaseAnalytics,
  caseCategoryStats,
  caseStatusStats
} from '../data/mockData';

const Reports = () => {
  const { cases, hearings, documents } = useApp();
  const [dateRange, setDateRange] = useState('2026-ALL');

  // Performance calculations
  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.status?.toLowerCase() === 'active').length;
  const pendingCases = cases.filter(c => c.status?.toLowerCase() === 'pending').length;
  const closedCases = cases.filter(c => c.status?.toLowerCase() === 'closed').length;
  const disposalRate = totalCases > 0 ? ((closedCases / totalCases) * 100).toFixed(1) : '24.2';

  // Dynamic Case Status Distribution
  const dynamicStatusStats = [
    { name: 'Active Cases', value: Math.max(activeCases, 1), color: '#142B4A' },
    { name: 'Pending Hearings', value: Math.max(pendingCases, 1), color: '#C6A15B' },
    { name: 'Closed Cases', value: Math.max(closedCases, 1), color: '#10B981' },
  ];

  // Dynamic Case Category Breakdown
  const categoryCounts = {};
  cases.forEach(c => {
    const cat = c.category || 'Civil Property';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const dynamicCategoryStats = Object.keys(categoryCounts).length > 0
    ? Object.keys(categoryCounts).map(name => ({ name, value: categoryCounts[name] }))
    : caseCategoryStats;

  // Dynamic Monthly Analytics
  const dynamicMonthlyAnalytics = monthlyCaseAnalytics;

  // Download CSV export functionality
  const handleDownloadCSV = () => {
    const headers = ["Case Number", "Title", "Category", "Court Name", "Client", "Assigned Lawyer", "Filing Date", "Status", "Priority"];
    const rows = cases.map(c => [
      `"${c.caseNumber}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.courtName}"`,
      `"${c.clientName}"`,
      `"${c.assignedLawyer}"`,
      `"${c.filingDate}"`,
      `"${c.status}"`,
      `"${c.priority || 'Medium'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `JurisTrack_Case_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142B4A] dark:text-white">
            Reports & Judicial Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Statistical docket clearance, court hearing velocity, and litigation lifecycle metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="py-2 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <option value="2026-ALL">Current Judicial Year (2026)</option>
            <option value="2026-Q1">Q1 Fiscal Period</option>
            <option value="2026-Q2">Q2 Fiscal Period</option>
            <option value="2025-ALL">Preceding Year (2025)</option>
          </select>

          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 bg-[#142B4A] hover:bg-[#24466B] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Dockets"
          value={totalCases}
          subtitle="Cumulative judicial registry"
          icon={Briefcase}
          trend="+14% YoY"
          accentColor="primary"
        />
        <StatCard
          title="Active Matters"
          value={activeCases}
          subtitle="Under judicial scrutiny"
          icon={TrendingUp}
          accentColor="gold"
        />
        <StatCard
          title="Scheduled Hearings"
          value={hearings.filter(h => h.status === 'Scheduled').length}
          subtitle="Next 60 days calendar"
          icon={Clock}
          accentColor="rose"
        />
        <StatCard
          title="Case Disposal Efficiency"
          value={`${disposalRate}%`}
          subtitle="Closed vs filed ratio"
          icon={CheckCircle2}
          trend="+3.4%"
          accentColor="emerald"
        />
      </div>

      {/* Charts Grid Row 1: Cases by Status & Cases by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases by Status (Doughnut) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">1. Cases by Status</h2>
              <p className="text-xs text-slate-500">Registry proportions</p>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#C6A15B]">Real-Time Ratio</span>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dynamicStatusStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {dynamicStatusStats.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#142B4A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val) => <span className="text-xs text-slate-600 dark:text-slate-300">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cases by Category (Horizontal Bar) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">2. Cases by Practice Category</h2>
              <p className="text-xs text-slate-500">Concentration across practice divisions</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Total 6 Domains</span>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={dynamicCategoryStats}
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  width={110}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#142B4A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" name="Cases Filed" fill="#142B4A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2: Monthly Case Registrations & Monthly Hearing Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Case Registrations (Bar Chart) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">3. Monthly Case Registrations vs Disposals</h2>
              <p className="text-xs text-slate-500">Intake velocity over 12-month calendar</p>
            </div>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCaseAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#142B4A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="top" height={30} />
                <Bar dataKey="newCases" name="New Cases" fill="#142B4A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolvedCases" name="Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Hearing Statistics (Area Chart) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">4. Monthly Hearing Workload & Appearances</h2>
              <p className="text-xs text-slate-500">Bench appearances listed across all courts</p>
            </div>
            <span className="text-xs font-semibold text-[#C6A15B]">Peak in Nov</span>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyCaseAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHearings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C6A15B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#C6A15B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#142B4A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="hearings"
                  name="Court Hearings"
                  stroke="#C6A15B"
                  fillOpacity={1}
                  fill="url(#colorHearings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Case Completion Lifecycle Overview */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">5. Case Completion Overview & Progression Rates</h2>
            <p className="text-xs text-slate-500">Average duration from filing to judgment by case category</p>
          </div>
          <span className="text-xs text-slate-400">High Court Bench Benchmark</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Commercial Disputes</span>
            <p className="text-lg font-bold text-[#142B4A] dark:text-white">8.4 Months</p>
            <p className="text-[11px] text-emerald-600 mt-1">22% faster than national average</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Civil Land & Property</span>
            <p className="text-lg font-bold text-[#142B4A] dark:text-white">14.2 Months</p>
            <p className="text-[11px] text-amber-600 mt-1">Survey commission latency: 3.1 mo</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Consumer Forum Actions</span>
            <p className="text-lg font-bold text-[#142B4A] dark:text-white">5.8 Months</p>
            <p className="text-[11px] text-emerald-600 mt-1">92% settlement rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
