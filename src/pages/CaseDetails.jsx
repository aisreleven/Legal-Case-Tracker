import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  User,
  Building2,
  Scale,
  Edit2,
  Trash2,
  PlusCircle,
  Download,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Share2,
  Printer
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';

const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, hearings, documents, activities, deleteCase, downloadDocument, addHearing, currentUser } = useApp();

  const caseData = cases.find(c => c.id === id || c.caseNumber === id);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newHearingForm, setNewHearingForm] = useState({
    date: '2026-11-30',
    time: '11:00 AM',
    courtroom: caseData?.courtroom || 'Courtroom 302',
    type: 'Evidence Examination',
    notes: 'Counsel to present authenticated deed records.'
  });

  if (!caseData) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#142B4A] dark:text-white">Case Docket Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested case identifier does not exist in the active judicial registry.
        </p>
        <button
          onClick={() => navigate('/cases')}
          className="mt-5 px-4 py-2 bg-[#142B4A] text-white text-xs font-bold rounded-xl"
        >
          Return to Case Registry
        </button>
      </div>
    );
  }

  // Filter hearings associated with this case
  const caseHearings = hearings.filter(h => h.caseId === caseData.id || h.caseNumber === caseData.caseNumber);

  // Filter documents associated with this case
  const caseDocs = documents.filter(d => d.caseId === caseData.id || d.caseNumber === caseData.caseNumber);

  // Handle schedule hearing
  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    addHearing({
      caseId: caseData.id,
      caseNumber: caseData.caseNumber,
      caseTitle: caseData.title,
      hearingDate: newHearingForm.date,
      hearingTime: newHearingForm.time,
      courtName: caseData.courtName,
      courtroom: newHearingForm.courtroom,
      hearingType: newHearingForm.type,
      assignedLawyer: caseData.assignedLawyer,
      lawyerId: caseData.lawyerId,
      clientName: caseData.clientName,
      status: 'Scheduled',
      notes: newHearingForm.notes
    });
    setShowScheduleModal(false);
  };

  const handleDelete = () => {
    deleteCase(caseData.id);
    navigate('/cases');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/cases')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#142B4A] dark:hover:text-gold transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Docket List</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            title="Print Case Summary"
          >
            <Printer className="w-4 h-4" />
          </button>

          {currentUser?.role !== 'Client' && (
            <>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Schedule Hearing</span>
              </button>

              <button
                onClick={() => navigate(`/cases/edit/${caseData.id}`)}
                className="px-3.5 py-2 bg-[#142B4A] hover:bg-[#24466B] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Case</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl transition-colors"
                title="Delete Case"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Case Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-gold border border-[#142B4A]/20">
                {caseData.caseNumber}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {caseData.category}
              </span>
              <StatusBadge status={caseData.status} />
              <StatusBadge status={caseData.priority} type="priority" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#142B4A] dark:text-white">
              {caseData.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{caseData.courtName} • {caseData.courtroom} • Judge: {caseData.judge || "Hon'ble Division Bench"}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Court Appearance</span>
              <span className="text-sm font-bold text-[#142B4A] dark:text-gold">
                {caseData.nextHearingDate ? `${caseData.nextHearingDate} at ${caseData.nextHearingTime || '10:30 AM'}` : 'Awaiting listing'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#C6A15B]/20 text-[#B08B42] flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 4 Metadata Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Client Representation</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{caseData.clientName}</p>
            <p className="text-[11px] text-slate-500">{caseData.clientPhone || '+91 98201 44521'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lead Advocate</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{caseData.assignedLawyer}</p>
            <p className="text-[11px] text-[#C6A15B] font-medium">Bar Counsel</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Filing Registration</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{caseData.filingDate}</p>
            <p className="text-[11px] text-slate-500">Verified Docket Entry</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Current Milestone Stage</span>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{caseData.progressStage || 'Evidence Phase'}</p>
            <p className="text-[11px] text-slate-500">{caseData.progressPercent || 65}% Completed</p>
          </div>
        </div>

        {/* Case Description */}
        {caseData.description && (
          <div className="mt-6 p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <span className="font-bold text-[#142B4A] dark:text-white block mb-1">Petition Summary & Statement of Claim:</span>
            {caseData.description}
          </div>
        )}
      </div>

      {/* Grid: Case Progress Timeline & Hearing History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Case Progress Timeline (Item 11) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Case Progress Milestones</h2>
              <p className="text-xs text-slate-500">Procedural journey from filing to judgment</p>
            </div>
            <span className="text-xs font-bold text-[#C6A15B]">{caseData.progressPercent || 65}%</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {caseData.caseProgress && caseData.caseProgress.length > 0 ? (
              caseData.caseProgress.map((step, idx) => (
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
              ))
            ) : (
              <p className="text-xs text-slate-400">Milestone records initialized upon summons verification.</p>
            )}
          </div>
        </div>

        {/* Hearing History (Item 9) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div>
              <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Hearing Docket & History</h2>
              <p className="text-xs text-slate-500">Court calls and recorded interim orders</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{caseHearings.length} Scheduled / Past</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {caseHearings.length > 0 ? (
              caseHearings.map(h => (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#C6A15B]" />
                      <span className="text-xs font-bold text-[#142B4A] dark:text-white">
                        {h.hearingDate} at {h.hearingTime}
                      </span>
                    </div>
                    <StatusBadge status={h.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {h.hearingType} • {h.courtroom}
                  </p>
                  <p className="text-xs text-slate-500">{h.notes}</p>
                  {h.outcome && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-[#142B4A] dark:text-gold">Recorded Outcome:</span> {h.outcome}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">
                No past hearings recorded for this docket yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Associated Documents (Item 10) */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#142B4A] dark:text-white">Associated Legal Documents</h2>
            <p className="text-xs text-slate-500">Certified petitions, affidavits, orders, and evidence filings</p>
          </div>
          <button
            onClick={() => navigate('/documents')}
            className="text-xs font-semibold text-[#142B4A] dark:text-gold hover:underline"
          >
            Open Document Repository →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {caseDocs.length > 0 ? (
            caseDocs.map(doc => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {doc.fileType?.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400">{doc.fileSize}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">{doc.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{doc.category}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Uploaded {doc.uploadDate}</span>
                  <button
                    onClick={() => downloadDocument(doc)}
                    className="p-1.5 bg-[#142B4A] hover:bg-[#24466B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 px-3"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-xs text-slate-400">
              No files currently attached to this case. Visit Documents module to attach records.
            </div>
          )}
        </div>
      </div>

      {/* Schedule Hearing Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Hearing for this Case"
        subtitle={`Case ${caseData.caseNumber} - ${caseData.title}`}
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Hearing Date</label>
              <input
                type="date"
                value={newHearingForm.date}
                onChange={(e) => setNewHearingForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Hearing Time</label>
              <input
                type="text"
                value={newHearingForm.time}
                onChange={(e) => setNewHearingForm(prev => ({ ...prev, time: e.target.value }))}
                placeholder="10:30 AM"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Courtroom / Bench</label>
              <input
                type="text"
                value={newHearingForm.courtroom}
                onChange={(e) => setNewHearingForm(prev => ({ ...prev, courtroom: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Hearing Type</label>
              <select
                value={newHearingForm.type}
                onChange={(e) => setNewHearingForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Evidence Examination">Evidence Examination</option>
                <option value="Oral Arguments">Oral Arguments</option>
                <option value="Bail & Quashing Hearing">Bail & Quashing Hearing</option>
                <option value="Framing of Issues">Framing of Issues</option>
                <option value="Settlement Consent">Settlement Consent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Advocate Directive / Notes</label>
            <textarea
              rows={2}
              value={newHearingForm.notes}
              onChange={(e) => setNewHearingForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#142B4A] text-white font-bold rounded-xl hover:bg-[#24466B]"
            >
              Confirm Hearing
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Docket Deletion"
        subtitle="This action cannot be undone."
      >
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Are you sure you want to remove case docket <strong>{caseData.caseNumber}</strong> from the judicial register?
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 border rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
          >
            Confirm Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CaseDetails;
