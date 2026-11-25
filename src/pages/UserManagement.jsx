import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Power,
  Shield,
  Briefcase,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';

const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'Lawyer',
    specialization: '',
    department: '',
    company: ''
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (roleFilter !== 'All' && u.role?.toLowerCase() !== roleFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter]);

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'Lawyer',
      specialization: '',
      department: '',
      company: ''
    });
    setUserToEdit(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (user) => {
    setUserToEdit(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'Lawyer',
      specialization: user.specialization || '',
      department: user.department || '',
      company: user.company || ''
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    if (userToEdit) {
      updateUser(userToEdit.id, formData);
    } else {
      addUser(formData);
    }

    setShowAddModal(false);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const columns = [
    {
      header: 'User ID & Profile',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
            alt={row.fullName}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
          />
          <div>
            <p className="font-bold text-[#142B4A] dark:text-white leading-tight">{row.fullName}</p>
            <span className="font-mono text-[10px] text-slate-400">{row.id}</span>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => <StatusBadge status={row.role} type="role" />,
      sortable: true
    },
    {
      header: 'Contact Details',
      accessor: 'email',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-700 dark:text-slate-300 block">{row.email}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.phone}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Designation / Field',
      accessor: 'specialization',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {row.specialization || row.department || row.company || 'Legal Member'}
        </span>
      ),
      sortable: false
    },
    {
      header: 'Registration Date',
      accessor: 'registrationDate',
      render: (row) => (
        <span className="text-xs text-slate-500 font-mono">{row.registrationDate || '2023-01-15'}</span>
      ),
      sortable: true
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'Active'} />,
      sortable: true
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleUserStatus(row.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === 'Active'
                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
            title={row.status === 'Active' ? 'Deactivate account' : 'Activate account'}
          >
            <Power className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
            title="Edit User Profile"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setUserToDelete(row)}
            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
            title="Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (currentUser?.role?.toLowerCase() !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-[#E5EAF0] dark:border-slate-800 shadow-sm animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#142B4A] dark:text-white">Admin Privileges Required</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          The User Governance and Role Assignment console is restricted strictly to verified Judicial Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142B4A] dark:text-white">
            User Governance & Access Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage practicing advocates, institutional administrators, and registered clients
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#142B4A] hover:bg-[#24466B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User Profile</span>
        </button>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search users by name, email, role, or phone..."
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <option value="All">All User Roles</option>
            <option value="Admin">Administrator</option>
            <option value="Lawyer">Advocate / Lawyer</option>
            <option value="Client">Client</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        pageSize={8}
        emptyMessage="No users found matching query."
      />

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={userToEdit ? "Edit User Account" : "Register Demo System User"}
        subtitle="Manage credentials and system role access"
      >
        <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Full Legal Name *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="e.g. Adv. Saurabh Sen"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@juristrack.com"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98123 45678"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">System Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Lawyer">Advocate / Lawyer</option>
              <option value="Client">Client</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Specialization / Department / Company</label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
              placeholder="e.g. Commercial Litigation or Corporate Legal Counsel"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#142B4A] hover:bg-[#24466B] text-white font-bold rounded-xl"
            >
              {userToEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        title="Confirm User Account Removal"
        subtitle="This action will delete user access credentials."
      >
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Are you sure you want to remove user <strong>{userToDelete?.fullName}</strong> ({userToDelete?.email})?
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setUserToDelete(null)}
            className="px-4 py-2 border rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
          >
            Confirm Removal
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
