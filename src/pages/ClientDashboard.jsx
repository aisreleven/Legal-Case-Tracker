import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Clock,
  FileText,
  User,
  Shield,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useApp } from '../context/AppContext';

const ClientDashboard = () => {
  const { currentUser, cases, hearings, documents, notifications, downloadDocument } = useApp();
  const navigate = useNavigate();

  // Find cases for this client
  const clientCases = cases.filter(c =>
    c.clientId === currentUser?.id || c.clientName?.toLowerCase().includes(currentUser?.fullName?.toLowerCase() || 'suresh')
  );
  const myCases = clientCases.length > 0 ? clientCases : cases.slice(0, 3);
  const primaryCase = myCases[0] || cases[0];

  const activeCount = myCases.filter(c => c.status?.toLowerCase() === 'active').length;
  const pendingCount = myCases.filter(c => c.status?.toLowerCase() === 'pending').length;
  const completedCount = myCases.filter(c => c.status?.toLowerCase() === 'closed').length;

  // Upcoming hearings for client's cases
  const clientCaseIds = myCases.map(c => c.id);
  const myHearings = hearings.filter(h => clientCaseIds.includes(h.caseId) || h.clientName === currentUser?.fullName);
  const displayHearings = myHearings.length > 0 ? myHearings : hearings.slice(0, 3);

  // Shared documents
  const myDocs = documents.filter(d => clientCaseIds.includes(d.caseId) || d.uploadedBy?.includes(currentUser?.fullName || 'Client'));
  const displayDocs = myDocs.length > 0 ? myDocs : documents.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Reassuring Client Banner */}
      <div className="bg-gradient-to-r from-[#142B4A] via-[#1D3B63] to-[#24466B] p-6 rounded-2xl text-white shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#C6A15B]/30 text-[#C6A15B] text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Client Case Tracking Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Welcome, {currentUser?.fullName || 'Suresh Jindal'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {currentUser?.company || 'Apex Real Estate Holdings'} • Transparent live tracking of legal matters & court orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/documents')}
              className="px-4 py-2 bg-[#C6A15B] hover:bg-[#B08B42] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Access Legal Vault
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="My Legal Cases"
          value={myCases.length}
          subtitle="Registered matters"
          icon={Briefcase}
          onClick={() => navigate('/cases')}
          accentColor="primary"
        />
        <StatCard
          title="Active Cases"
          value={activeCount}
          subtitle="Currently in court"
          icon={Shield}
          onClick={() => navigate('/cases')}
          accentColor="gold"
        />
        <StatCard
          title="Pending Cases"
          value={pendingCount}
          subtitle="Awaiting procedural action"
          icon={AlertCircle}
          onClick={() => navigate('/cases')}
          accentColor="amber"
        />
        <StatCard
          title="Completed Cases"
          value={completedCount}
          subtitle="Decreed / resolved"
          icon={CheckCircle2}
          onClick={() => navigate('/cases')}
          accentColor="emerald"
        />
        <StatCard
          title="Upcoming Hearings"
          value={displayHearings.filter(h => h.status === 'Scheduled').length}
          subtitle="Next court dates"
          icon={Clock}
          onClick={() => navigate('/hearings')}
          accentColor="rose"
        />
      </div>

      {/* Main Grid: My Cases & Assigned Lawyer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* My Legal Cases with Progress */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">My Active Legal Matters</h2>
              <p className="text-xs text-slate-500">Live procedural stage and next court listing</p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="text-xs font-semibold text-[#142B4A] dark:text-gold hover:underline flex items-center gap-1"
            >
              <span>View Full Case File</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {myCases.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-[#142B4A] dark:hover:border-sky-400 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#142B4A] dark:text-gold">{c.caseNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {c.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{c.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{c.courtName} • {c.courtroom}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Assigned Advocate</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{c.assignedLawyer}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Next Hearing Date</span>
                    <span className="font-semibold text-[#142B4A] dark:text-gold">{c.nextHearingDate || 'Awaiting listing'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Current Stage</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{c.progressStage || 'Evidence Phase'}</span>
                  </div>
                </div>

                {/* Case progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Case Milestone Completion</span>
                    <span className="font-bold text-[#142B4A] dark:text-gold">{c.progressPercent || 65}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#142B4A] to-[#C6A15B] rounded-full"
                      style={{ width: `${c.progressPercent || 65}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Lawyer Information Card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Assigned Legal Counsel</h2>
                <p className="text-xs text-slate-500">Your retained advocate</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                Active Brief
              </span>
            </div>

            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
                alt="Advocate"
                className="w-16 h-16 rounded-2xl object-cover mx-auto ring-4 ring-[#C6A15B]/30 mb-3"
              />
              <h3 className="text-sm font-bold text-[#142B4A] dark:text-white">
                {primaryCase?.assignedLawyer || 'Adv. Vikram Malhotra'}
              </h3>
              <p className="text-xs text-[#C6A15B] font-semibold">Senior Commercial Litigator</p>
              <p className="text-[11px] text-slate-500 mt-1">High Court & Appellate Counsel</p>

              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700 space-y-2 text-left text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>+91 98112 33412</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>vikram.malhotra@juristrack.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bar Roll: BCI/DEL/2012/9941</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => navigate('/documents')}
              className="w-full py-2 bg-[#142B4A] hover:bg-[#24466B] text-white text-xs font-semibold rounded-xl transition-all"
            >
              Share Documents with Counsel
            </button>
          </div>
        </div>
      </div>

      {/* Case Progress Timeline & Upcoming Hearings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Case Progress Timeline */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Case Progress Timeline</h2>
              <p className="text-xs text-slate-500">{primaryCase?.caseNumber} - Chronological milestones</p>
            </div>
            <span className="text-xs font-semibold text-[#C6A15B]">Stage 5 of 6</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {primaryCase?.caseProgress?.map((step, idx) => (
              <div key={idx} className="relative">
                <span
                  className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 ${
                    step.completed
                      ? 'border-emerald-500 text-emerald-500 ring-2 ring-emerald-100'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold ${step.completed ? 'text-[#142B4A] dark:text-white' : 'text-slate-500'}`}>
                    {step.stage}
                  </h4>
                  <span className="text-[10px] text-slate-400">{step.date}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Hearings for Client */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Upcoming Court Hearings</h2>
              <p className="text-xs text-slate-500">Dates requiring party awareness</p>
            </div>
            <button
              onClick={() => navigate('/hearings')}
              className="text-xs text-[#C6A15B] font-semibold hover:underline"
            >
              Full Cause List →
            </button>
          </div>

          <div className="space-y-3">
            {displayHearings.map(h => (
              <div
                key={h.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#142B4A] dark:text-gold">{h.hearingDate}</span>
                  <StatusBadge status={h.status} />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{h.caseNumber} - {h.caseTitle}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{h.courtName} ({h.courtroom}) • {h.hearingType}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Counsel Note:</span> {h.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shared Documents Section */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Shared Legal Documents</h2>
            <p className="text-xs text-slate-500">Petitions, injunctions, and certified court decrees</p>
          </div>
          <button
            onClick={() => navigate('/documents')}
            className="text-xs font-semibold text-[#142B4A] dark:text-gold hover:underline"
          >
            All Shared Files →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayDocs.map(doc => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {doc.fileType?.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-400">{doc.fileSize}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">{doc.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{doc.category}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{doc.uploadDate}</span>
                <button
                  onClick={() => downloadDocument(doc)}
                  className="p-1.5 bg-[#142B4A] hover:bg-[#24466B] text-white rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold px-2.5"
                  title="Download File"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
