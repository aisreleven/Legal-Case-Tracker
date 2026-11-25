import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Calendar as CalendarIcon,
  PlusCircle,
  Filter,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  MapPin,
  ExternalLink
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';

const Hearings = () => {
  const { hearings, cases, deleteHearing, rescheduleHearing, currentUser } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [hearingToReschedule, setHearingToReschedule] = useState(null);

  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    notes: '',
    status: 'Scheduled'
  });

  // Filtered dataset
  const filteredHearings = useMemo(() => {
    return hearings.filter(h => {
      // If client, only their cases
      if (currentUser?.role === 'Client') {
        const isClient = h.clientName?.toLowerCase().includes(currentUser?.fullName?.toLowerCase());
        if (!isClient) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          h.caseNumber.toLowerCase().includes(q) ||
          h.caseTitle.toLowerCase().includes(q) ||
          h.courtName.toLowerCase().includes(q) ||
          h.assignedLawyer.toLowerCase().includes(q) ||
          h.hearingType.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (statusFilter !== 'All' && h.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      if (dateFilter && h.hearingDate < dateFilter) {
        return false;
      }

      return true;
    });
  }, [hearings, searchQuery, statusFilter, dateFilter, currentUser]);

  const openReschedule = (h) => {
    setHearingToReschedule(h);
    setRescheduleData({
      newDate: h.hearingDate,
      newTime: h.hearingTime,
      notes: h.notes || '',
      status: h.status
    });
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (hearingToReschedule) {
      rescheduleHearing(
        hearingToReschedule.id,
        rescheduleData.newDate,
        rescheduleData.newTime,
        rescheduleData.notes,
        rescheduleData.status
      );
      setHearingToReschedule(null);
    }
  };

  const columns = [
    {
      header: 'Hearing Date & Time',
      accessor: 'hearingDate',
      render: (row) => (
        <div>
          <span className="font-bold text-[#142B4A] dark:text-white block">{row.hearingDate}</span>
          <span className="text-[11px] text-[#C6A15B] font-semibold">{row.hearingTime}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Case Number & Title',
      accessor: 'caseNumber',
      render: (row) => (
        <div>
          <span className="font-bold text-[#142B4A] dark:text-gold hover:underline cursor-pointer">
            {row.caseNumber}
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-200 truncate max-w-xs">{row.caseTitle}</p>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Court & Bench',
      accessor: 'courtName',
      render: (row) => (
        <div>
          <span className="text-slate-700 dark:text-slate-200 block truncate max-w-[160px]">{row.courtName}</span>
          <span className="text-[11px] text-slate-400">{row.courtroom}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Hearing Type',
      accessor: 'hearingType',
      render: (row) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{row.hearingType}</span>
      ),
      sortable: true
    },
    {
      header: 'Assigned Counsel',
      accessor: 'assignedLawyer',
      render: (row) => (
        <span className="text-slate-600 dark:text-slate-300 text-xs">{row.assignedLawyer}</span>
      ),
      sortable: true
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
      sortable: true
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedHearing(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-[#142B4A] dark:hover:text-gold hover:bg-slate-100 transition-colors"
            title="Hearing Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {currentUser?.role !== 'Client' && (
            <>
              <button
                onClick={() => openReschedule(row)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                title="Reschedule / Update Status"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteHearing(row.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Remove Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142B4A] dark:text-white">
            Court Hearing Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Master cause list, courtroom appearances, and judicial progress records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/calendar')}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Open Master Calendar</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="w-full md:flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by case number, title, court, or hearing type..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Hearing Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Postponed">Postponed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
            />

            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('All'); setDateFilter(''); }}
              className="p-2 text-slate-500 hover:text-[#142B4A] rounded-xl hover:bg-slate-100 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hearings Data Table */}
      <DataTable
        columns={columns}
        data={filteredHearings}
        pageSize={8}
        onRowClick={(row) => setSelectedHearing(row)}
        emptyMessage="No hearings listed matching the selected parameters."
      />

      {/* Hearing Details Modal */}
      <Modal
        isOpen={Boolean(selectedHearing)}
        onClose={() => setSelectedHearing(null)}
        title="Hearing Information"
        subtitle={`Case ${selectedHearing?.caseNumber}`}
      >
        {selectedHearing && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                <StatusBadge status={selectedHearing.status} />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedHearing.hearingType}</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-[#142B4A] dark:text-white">{selectedHearing.caseTitle}</h3>

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

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Directives & Notes</span>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 text-slate-700 dark:text-slate-300">
                {selectedHearing.notes || 'None recorded.'}
              </p>
            </div>

            {selectedHearing.outcome && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Outcome</span>
                <p className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-800 dark:text-emerald-300">
                  {selectedHearing.outcome}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigate(`/cases/${selectedHearing.caseId || 'case-001'}`);
                  setSelectedHearing(null);
                }}
                className="px-3.5 py-1.5 bg-[#142B4A] text-white rounded-xl font-bold"
              >
                View Full Case
              </button>
              <button
                type="button"
                onClick={() => setSelectedHearing(null)}
                className="px-3 py-1.5 border rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Hearing Modal */}
      <Modal
        isOpen={Boolean(hearingToReschedule)}
        onClose={() => setHearingToReschedule(null)}
        title="Reschedule / Update Hearing"
        subtitle={`Case ${hearingToReschedule?.caseNumber}`}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Hearing Date</label>
              <input
                type="date"
                value={rescheduleData.newDate}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, newDate: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Hearing Time</label>
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
            <label className="block font-semibold mb-1">Status</label>
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
            <label className="block font-semibold mb-1">Reason / Notes</label>
            <textarea
              rows={3}
              value={rescheduleData.notes}
              onChange={(e) => setRescheduleData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setHearingToReschedule(null)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#142B4A] hover:bg-[#24466B] text-white font-bold rounded-xl"
            >
              Save Reschedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Hearings;
