import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Clock,
  Calendar,
  PlusCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckSquare
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';

const LawyerDashboard = () => {
  const { currentUser, cases, hearings, documents, activities, addHearing, addDocument } = useApp();
  const navigate = useNavigate();

  // Filter cases assigned to this lawyer (or show all in demo if admin/unassigned)
  const lawyerCases = cases.filter(c =>
    c.lawyerId === currentUser?.id || c.assignedLawyer?.includes(currentUser?.fullName?.split(' ')[1] || 'Vikram')
  );
  const displayCases = lawyerCases.length > 0 ? lawyerCases : cases.slice(0, 5);

  const activeCases = displayCases.filter(c => c.status?.toLowerCase() === 'active');
  const pendingCases = displayCases.filter(c => c.status?.toLowerCase() === 'pending');
  const closedCases = displayCases.filter(c => c.status?.toLowerCase() === 'closed');

  // Filter hearings
  const myHearings = hearings.filter(h =>
    h.lawyerId === currentUser?.id || h.assignedLawyer?.includes(currentUser?.fullName?.split(' ')[1] || 'Vikram')
  );
  const displayHearings = myHearings.length > 0 ? myHearings : hearings;

  // Modals for quick actions
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Schedule hearing form state
  const [scheduleForm, setScheduleForm] = useState({
    caseId: displayCases[0]?.id || '',
    hearingDate: '2026-11-25',
    hearingTime: '10:30 AM',
    courtName: 'Delhi High Court - Bench 2',
    courtroom: 'Courtroom 204',
    hearingType: 'Oral Arguments',
    notes: 'Submit printed compilation of statutory citations.'
  });

  // Upload document form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    caseId: displayCases[0]?.id || '',
    category: 'Case Petitions',
    fileType: 'pdf',
    description: ''
  });

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    const targetCase = cases.find(c => c.id === scheduleForm.caseId) || displayCases[0];
    addHearing({
      caseId: targetCase.id,
      caseNumber: targetCase.caseNumber,
      caseTitle: targetCase.title,
      hearingDate: scheduleForm.hearingDate,
      hearingTime: scheduleForm.hearingTime,
      courtName: scheduleForm.courtName,
      courtroom: scheduleForm.courtroom,
      hearingType: scheduleForm.hearingType,
      assignedLawyer: currentUser?.fullName || "Adv. Vikram Malhotra",
      lawyerId: currentUser?.id || "usr-002",
      clientName: targetCase.clientName,
      status: 'Scheduled',
      notes: scheduleForm.notes
    });
    setShowScheduleModal(false);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) return;
    const targetCase = cases.find(c => c.id === uploadForm.caseId) || displayCases[0];
    addDocument({
      title: uploadForm.title,
      caseId: targetCase.id,
      caseNumber: targetCase.caseNumber,
      caseTitle: targetCase.title,
      category: uploadForm.category,
      fileType: uploadForm.fileType,
      fileSize: "2.4 MB",
      description: uploadForm.description || "Uploaded by counsel for judicial records.",
      contentSnippet: `LEGAL FILING: ${uploadForm.title.toUpperCase()}\nSubmitted on behalf of ${targetCase.clientName} in matter ${targetCase.caseNumber}.`
    });
    setShowUploadModal(false);
    setUploadForm({ title: '', caseId: displayCases[0]?.id || '', category: 'Case Petitions', fileType: 'pdf', description: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Welcome Banner with Advocate Credentials */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#142B4A] via-[#1D3B63] to-[#24466B] p-6 rounded-2xl text-white shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-[#C6A15B]/30 text-[#C6A15B] text-xs font-bold uppercase tracking-wider">
              Advocate Chambers
            </span>
            <span className="text-xs text-slate-300">
              Bar Council: {currentUser?.barCouncilId || 'BCI/DEL/2012/9941'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Counsel Workspace: {currentUser?.fullName || 'Adv. Vikram Malhotra'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {currentUser?.specialization || 'Corporate Litigation & Commercial Disputes'} • {currentUser?.experience || '14 Years'} Experience
          </p>
        </div>

        {/* 4 Action Buttons required by spec */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/cases/new')}
            className="px-3.5 py-2 bg-[#C6A15B] hover:bg-[#B08B42] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add New Case</span>
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Schedule Hearing</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => navigate('/cases')}
            className="px-3.5 py-2 bg-[#0F1E33] hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>View All Cases</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="My Total Cases"
          value={displayCases.length}
          subtitle="Briefs currently retained"
          icon={Briefcase}
          trend="+2 this month"
          onClick={() => navigate('/cases')}
          accentColor="primary"
        />
        <StatCard
          title="Active Cases"
          value={activeCases.length}
          subtitle="Under judicial hearing"
          icon={TrendingUp}
          onClick={() => navigate('/cases')}
          accentColor="gold"
        />
        <StatCard
          title="Pending Cases"
          value={pendingCases.length}
          subtitle="Awaiting evidence/notices"
          icon={AlertCircle}
          onClick={() => navigate('/cases')}
          accentColor="amber"
        />
        <StatCard
          title="Closed Cases"
          value={closedCases.length}
          subtitle="Favorable decrees"
          icon={CheckCircle2}
          onClick={() => navigate('/cases')}
          accentColor="emerald"
        />
        <StatCard
          title="Upcoming Hearings"
          value={displayHearings.filter(h => h.status === 'Scheduled').length}
          subtitle="Bench call dates"
          icon={Clock}
          onClick={() => navigate('/hearings')}
          accentColor="rose"
        />
      </div>

      {/* Main Grid: My Assigned Cases & Upcoming Hearings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* My Assigned Cases */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">My Assigned Briefs</h2>
              <p className="text-xs text-slate-500">Active representations and stage status</p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="text-xs font-semibold text-[#142B4A] dark:text-gold hover:underline flex items-center gap-1"
            >
              <span>Manage Docket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {displayCases.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#142B4A] dark:text-gold">{c.caseNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {c.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{c.title}</h3>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Client: <strong>{c.clientName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Next: <strong>{c.nextHearingDate}</strong></span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">{c.progressStage || 'Evidence Phase'}</span>
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

        {/* Today's & Upcoming Hearings */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Cause List & Court Calls</h2>
                <p className="text-xs text-slate-500">Hearings scheduled on your diary</p>
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="text-xs text-[#C6A15B] font-semibold hover:underline"
              >
                Open Calendar →
              </button>
            </div>

            <div className="space-y-3">
              {displayHearings.slice(0, 4).map(h => (
                <div
                  key={h.id}
                  onClick={() => navigate(`/hearings`)}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#142B4A] dark:text-white">{h.hearingTime}</span>
                    <StatusBadge status={h.status} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{h.caseNumber} - {h.caseTitle}</h4>
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{h.courtName} ({h.courtroom})</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 italic line-clamp-1">"{h.notes}"</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="w-full py-2 bg-[#142B4A] hover:bg-[#24466B] text-white text-xs font-semibold rounded-xl transition-all"
            >
              + Add Hearing to Docket
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Documents & Recent Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Legal Documents */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Recent Case Documents</h2>
              <p className="text-xs text-slate-500">Pleadings, affidavits & orders</p>
            </div>
            <button
              onClick={() => navigate('/documents')}
              className="text-xs font-semibold text-[#142B4A] dark:text-gold hover:underline"
            >
              All Documents →
            </button>
          </div>

          <div className="space-y-3">
            {documents.slice(0, 4).map(doc => (
              <div
                key={doc.id}
                onClick={() => navigate('/documents')}
                className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-sky-300 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{doc.title}</h3>
                    <p className="text-[10px] text-slate-400">{doc.caseNumber} • {doc.category}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">{doc.fileSize}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Practice Log & Actions</h2>
              <p className="text-xs text-slate-500">Chronological history</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Live Log</span>
          </div>

          <div className="space-y-3">
            {activities.slice(0, 4).map(act => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#142B4A] dark:bg-[#C6A15B] mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    <span className="text-[#142B4A] dark:text-gold">{act.user}</span> {act.action}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{act.target}</p>
                  <span className="text-[10px] text-slate-400">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Hearing Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Court Hearing"
        subtitle="Add a listing to the court cause list and sync with case profile"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Select Case</label>
            <select
              value={scheduleForm.caseId}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, caseId: e.target.value }))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Hearing Date</label>
              <input
                type="date"
                value={scheduleForm.hearingDate}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, hearingDate: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Hearing Time</label>
              <input
                type="text"
                value={scheduleForm.hearingTime}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, hearingTime: e.target.value }))}
                placeholder="10:30 AM"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Court Name</label>
              <input
                type="text"
                value={scheduleForm.courtName}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, courtName: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Courtroom / Bench</label>
              <input
                type="text"
                value={scheduleForm.courtroom}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, courtroom: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Hearing Type</label>
            <select
              value={scheduleForm.hearingType}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, hearingType: e.target.value }))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Oral Arguments">Oral Arguments</option>
              <option value="Evidence Examination">Evidence Examination</option>
              <option value="Framing of Issues">Framing of Issues</option>
              <option value="Bail & Quashing Hearing">Bail & Quashing Hearing</option>
              <option value="Mediation & Consent">Mediation & Consent</option>
              <option value="Order Pronouncement">Order Pronouncement</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Additional Notes</label>
            <textarea
              rows={2}
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="px-4 py-2 border rounded-xl hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#142B4A] text-white rounded-xl font-bold hover:bg-[#24466B]"
            >
              Schedule Hearing
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Legal Document"
        subtitle="Add evidence, petition, affidavit or order copy"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Document Title</label>
            <input
              type="text"
              value={uploadForm.title}
              onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Rejoinder Affidavit to Written Statement"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Associated Case</label>
              <select
                value={uploadForm.caseId}
                onChange={(e) => setUploadForm(prev => ({ ...prev, caseId: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.caseNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Document Category</label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Case Petitions">Case Petitions</option>
                <option value="Court Orders">Court Orders</option>
                <option value="Evidence">Evidence</option>
                <option value="Affidavits">Affidavits</option>
                <option value="Agreements">Agreements</option>
                <option value="Legal Notices">Legal Notices</option>
                <option value="Other Documents">Other Documents</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">File Type</label>
            <select
              value={uploadForm.fileType}
              onChange={(e) => setUploadForm(prev => ({ ...prev, fileType: e.target.value }))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="pdf">PDF (.pdf)</option>
              <option value="docx">Word (.docx)</option>
              <option value="jpg">Image (.jpg/.jpeg)</option>
              <option value="png">Image (.png)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Brief Description / Notes</label>
            <textarea
              rows={2}
              value={uploadForm.description}
              onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Summary of document contents..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 border rounded-xl hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#142B4A] text-white rounded-xl font-bold hover:bg-[#24466B]"
            >
              Upload Document
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LawyerDashboard;
