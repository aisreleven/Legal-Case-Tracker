import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Download,
  Calendar,
  Building2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';

const Cases = () => {
  const { cases, deleteCase, currentUser } = useApp();
  const navigate = useNavigate();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [courtFilter, setCourtFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Delete modal state
  const [caseToDelete, setCaseToDelete] = useState(null);

  // Extract unique courts and categories for filter dropdowns
  const categories = useMemo(() => {
    return ['All', ...new Set(cases.map(c => c.category))];
  }, [cases]);

  const courts = useMemo(() => {
    return ['All', ...new Set(cases.map(c => c.courtName.split('-')[0].trim()))];
  }, [cases]);

  // Filtered dataset
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Role filtering: if client, show only their cases
      if (currentUser?.role === 'Client') {
        const isClientCase = c.clientId === currentUser?.id || c.clientName?.toLowerCase().includes(currentUser?.fullName?.toLowerCase());
        if (!isClientCase) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.caseNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q) ||
          c.assignedLawyer.toLowerCase().includes(q) ||
          c.courtName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'All' && c.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && c.category !== categoryFilter) {
        return false;
      }

      // Court filter
      if (courtFilter !== 'All' && !c.courtName.includes(courtFilter)) {
        return false;
      }

      // Date filter
      if (dateFilter && c.filingDate < dateFilter) {
        return false;
      }

      return true;
    });
  }, [cases, searchQuery, statusFilter, categoryFilter, courtFilter, dateFilter, currentUser]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setCourtFilter('All');
    setDateFilter('');
  };

  const confirmDelete = () => {
    if (caseToDelete) {
      deleteCase(caseToDelete.id);
      setCaseToDelete(null);
    }
  };

  // Columns definition for DataTable
  const columns = [
    {
      header: 'Case Docket #',
      accessor: 'caseNumber',
      render: (row) => (
        <span className="font-bold text-[#142B4A] dark:text-gold hover:underline cursor-pointer">
          {row.caseNumber}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Case Title & Category',
      accessor: 'title',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100 max-w-xs truncate">{row.title}</p>
          <span className="text-[11px] text-slate-400">{row.category}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Client Name',
      accessor: 'clientName',
      render: (row) => (
        <span className="font-medium text-slate-700 dark:text-slate-200">{row.clientName}</span>
      ),
      sortable: true
    },
    {
      header: 'Assigned Counsel',
      accessor: 'assignedLawyer',
      render: (row) => (
        <span className="text-slate-600 dark:text-slate-300 font-medium">{row.assignedLawyer}</span>
      ),
      sortable: true
    },
    {
      header: 'Court & Bench',
      accessor: 'courtName',
      render: (row) => (
        <div className="max-w-[180px] truncate">
          <span className="text-slate-700 dark:text-slate-200 block truncate">{row.courtName}</span>
          <span className="text-[10px] text-slate-400 block">{row.courtroom}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Filing Date',
      accessor: 'filingDate',
      render: (row) => <span className="text-slate-500 font-mono text-xs">{row.filingDate}</span>,
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
            onClick={() => navigate(`/cases/${row.id}`)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-[#142B4A] dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Case Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {currentUser?.role !== 'Client' && (
            <>
              <button
                onClick={() => navigate(`/cases/edit/${row.id}`)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                title="Edit Case Information"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCaseToDelete(row)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete Case from Docket"
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142B4A] dark:text-white">
            Judicial Case Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Master register of filed petitions, criminal matters, and commercial litigations
          </p>
        </div>

        {currentUser?.role !== 'Client' && (
          <button
            onClick={() => navigate('/cases/new')}
            className="px-4 py-2.5 bg-[#142B4A] hover:bg-[#24466B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Case</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="w-full md:flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by case number, title, advocate, client, or court..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Closed">Closed</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>

            {/* Court Filter */}
            <select
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
            >
              {courts.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Courts' : c}</option>
              ))}
            </select>

            {/* Reset Filters */}
            <button
              onClick={handleResetFilters}
              className="p-2 text-slate-500 hover:text-[#142B4A] dark:hover:text-gold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset All Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(statusFilter !== 'All' || categoryFilter !== 'All' || courtFilter !== 'All' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Active Filters:</span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-md bg-[#142B4A]/10 text-[#142B4A] dark:text-gold text-[11px]">
                Search: "{searchQuery}"
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                Status: {statusFilter}
              </span>
            )}
            {categoryFilter !== 'All' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                Category: {categoryFilter}
              </span>
            )}
            {courtFilter !== 'All' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                Court: {courtFilter}
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-[#C6A15B] hover:underline font-semibold text-[11px]"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Cases Data Table */}
      <DataTable
        columns={columns}
        data={filteredCases}
        pageSize={8}
        onRowClick={(row) => navigate(`/cases/${row.id}`)}
        emptyMessage="No legal case records match the specified query and filters."
      />

      {/* Delete Confirmation Modal (PAGE E Requirement) */}
      <Modal
        isOpen={Boolean(caseToDelete)}
        onClose={() => setCaseToDelete(null)}
        title="Confirm Case Removal"
        subtitle="This action will delete the case docket and all associated hearing records."
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
              You are about to permanently remove case docket{' '}
              <strong>{caseToDelete?.caseNumber}</strong> ({caseToDelete?.title}).
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Please confirm that judicial orders or consent terms permit removal of this case record.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setCaseToDelete(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors"
            >
              Delete Case Record
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Cases;
