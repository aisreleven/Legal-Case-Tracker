import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { Clock, MapPin, User, FileText, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';

const HearingCalendar = () => {
  const { hearings, cases, addHearing, rescheduleHearing } = useApp();
  const navigate = useNavigate();

  const [selectedHearing, setSelectedHearing] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    caseId: cases[0]?.id || '',
    hearingDate: '2026-11-26',
    hearingTime: '11:00 AM',
    courtName: 'Delhi High Court - Bench 4',
    courtroom: 'Courtroom 302',
    hearingType: 'Evidence Examination',
    notes: 'Counsel to present witness statement.'
  });

  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    notes: '',
    status: 'Scheduled'
  });

  const handleSelectHearing = (hearing) => {
    setSelectedHearing(hearing);
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    const targetCase = cases.find(c => c.id === scheduleForm.caseId) || cases[0];
    addHearing({
      caseId: targetCase.id,
      caseNumber: targetCase.caseNumber,
      caseTitle: targetCase.title,
      hearingDate: scheduleForm.hearingDate,
      hearingTime: scheduleForm.hearingTime,
      courtName: scheduleForm.courtName,
      courtroom: scheduleForm.courtroom,
      hearingType: scheduleForm.hearingType,
      assignedLawyer: targetCase.assignedLawyer,
      lawyerId: targetCase.lawyerId,
      clientName: targetCase.clientName,
      status: 'Scheduled',
      notes: scheduleForm.notes
    });
    setShowScheduleModal(false);
  };

  const openReschedule = (h) => {
    setRescheduleData({
      newDate: h.hearingDate,
      newTime: h.hearingTime,
      notes: h.notes || '',
      status: h.status
    });
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (selectedHearing) {
      rescheduleHearing(
        selectedHearing.id,
        rescheduleData.newDate,
        rescheduleData.newTime,
        rescheduleData.notes,
        rescheduleData.status
      );
      setShowRescheduleModal(false);
      setSelectedHearing(prev => ({
        ...prev,
        hearingDate: rescheduleData.newDate,
        hearingTime: rescheduleData.newTime,
        notes: rescheduleData.notes,
        status: rescheduleData.status
      }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142B4A] dark:text-white">
            Court Hearing Master Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual cause list planner, courtroom call schedule, and hearing disposition diary
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-4 py-2.5 bg-[#142B4A] hover:bg-[#24466B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all self-start sm:self-auto"
        >
          + Schedule New Hearing
        </button>
      </div>

      {/* Calendar Component */}
      <Calendar
        hearings={hearings}
        onSelectHearing={handleSelectHearing}
        onScheduleNew={() => setShowScheduleModal(true)}
      />

      {/* Hearing Details Modal (PAGE D Requirement) */}
      <Modal
        isOpen={Boolean(selectedHearing && !showRescheduleModal)}
        onClose={() => setSelectedHearing(null)}
        title="Hearing Details & Case Docket"
        subtitle={selectedHearing?.caseNumber}
      >
        {selectedHearing && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                <StatusBadge status={selectedHearing.status} />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Hearing Stage</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedHearing.hearingType}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Matter Caption</span>
              <h3 className="text-sm font-bold text-[#142B4A] dark:text-white">{selectedHearing.caseTitle}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Date & Time</span>
                <span className="font-bold text-[#142B4A] dark:text-gold">{selectedHearing.hearingDate} at {selectedHearing.hearingTime}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Court & Bench</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedHearing.courtName} ({selectedHearing.courtroom})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Assigned Counsel</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedHearing.assignedLawyer}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Client Party</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedHearing.clientName}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Counsel Notes & Directive</span>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {selectedHearing.notes || 'No specific judicial directives entered for this call.'}
              </p>
            </div>

            {selectedHearing.outcome && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Recorded Judicial Outcome</span>
                <p className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">
                  {selectedHearing.outcome}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  navigate(`/cases/${selectedHearing.caseId || 'case-001'}`);
                  setSelectedHearing(null);
                }}
                className="text-[#142B4A] dark:text-gold font-bold hover:underline flex items-center gap-1"
              >
                <span>View Full Case File</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openReschedule(selectedHearing)}
                  className="px-3 py-1.5 bg-[#C6A15B] hover:bg-[#B08B42] text-white rounded-xl font-bold transition-colors"
                >
                  Reschedule Hearing
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHearing(null)}
                  className="px-3 py-1.5 border rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Hearing Modal (PAGE E Requirement) */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Court Hearing"
        subtitle={`Update call date or status for ${selectedHearing?.caseNumber}`}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">New Hearing Date</label>
              <input
                type="date"
                value={rescheduleData.newDate}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, newDate: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">New Hearing Time</label>
              <input
                type="text"
                value={rescheduleData.newTime}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, newTime: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Hearing Status</label>
            <select
              value={rescheduleData.status}
              onChange={(e) => setRescheduleData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Postponed">Postponed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Reason for Reschedule / Court Directives</label>
            <textarea
              rows={3}
              value={rescheduleData.notes}
              onChange={(e) => setRescheduleData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Adjourned on request of respondent counsel to review rejoinder..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowRescheduleModal(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#142B4A] hover:bg-[#24466B] text-white font-bold rounded-xl"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule New Hearing Modal (PAGE C Requirement) */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule New Hearing"
        subtitle="Create an appearance entry on the court calendar"
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
              <label className="block font-semibold mb-1">Courtroom Number</label>
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
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#142B4A] hover:bg-[#24466B] text-white font-bold rounded-xl"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HearingCalendar;
