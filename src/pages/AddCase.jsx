import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowLeft, Save, X, Scale } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AddCase = () => {
  const { addCase, users, currentUser } = useApp();
  const navigate = useNavigate();

  const lawyers = users.filter(u => u.role === 'Lawyer');
  const clients = users.filter(u => u.role === 'Client');

  const randomDocketNumber = `CIV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const [formData, setFormData] = useState({
    caseNumber: randomDocketNumber,
    title: '',
    category: 'Civil Property Dispute',
    courtName: 'Delhi High Court - Bench 4',
    courtroom: 'Courtroom 302, Annex Block',
    clientName: clients[0]?.fullName || 'Suresh Jindal',
    assignedLawyer: currentUser?.role === 'Lawyer' ? currentUser.fullName : (lawyers[0]?.fullName || 'Adv. Vikram Malhotra'),
    filingDate: new Date().toISOString().split('T')[0],
    nextHearingDate: '2026-11-28',
    nextHearingTime: '10:30 AM',
    status: 'Active',
    priority: 'Medium',
    description: '',
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.caseNumber.trim()) {
      setError('Case Docket Number is required.');
      return;
    }
    if (!formData.title.trim()) {
      setError('Please provide a legal case title (e.g. Petitioner vs Respondent).');
      return;
    }
    if (!formData.courtName.trim()) {
      setError('Court designation is required.');
      return;
    }
    if (!formData.clientName.trim()) {
      setError('Client representation must be specified.');
      return;
    }

    const matchedClient = clients.find(c => c.fullName === formData.clientName);
    const matchedLawyer = lawyers.find(l => l.fullName === formData.assignedLawyer);

    const newCase = addCase({
      ...formData,
      clientId: matchedClient?.id || 'usr-005',
      clientEmail: matchedClient?.email || 'client@juristrack.com',
      lawyerId: matchedLawyer?.id || 'usr-002',
    });

    navigate(`/cases/${newCase.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#142B4A] dark:hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cases</span>
        </button>

        <span className="text-xs text-slate-400">JurisTrack Judicial Docket Registry</span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-sky-300 rounded-2xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#142B4A] dark:text-white">
              Register New Legal Case Docket
            </h1>
            <p className="text-xs text-slate-500">
              Submit formal petition metadata into the centralized court management repository
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-xs">
          {/* Row 1: Case Number & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Case Docket Number *
              </label>
              <input
                type="text"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                placeholder="e.g. CIV-2026-1049"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Case Title (Parties Involved) *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Acme Corp vs. State Infrastructure Board"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
                required
              />
            </div>
          </div>

          {/* Row 2: Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Case Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Civil Property Dispute">Civil Property Dispute</option>
                <option value="Contract Dispute">Contract Dispute</option>
                <option value="Consumer Protection Case">Consumer Protection Case</option>
                <option value="Criminal Matter">Criminal Matter</option>
                <option value="Family Dispute">Family Dispute</option>
                <option value="Commercial Dispute">Commercial Dispute</option>
                <option value="Constitutional Writ">Constitutional Writ</option>
                <option value="Labour Dispute">Labour Dispute</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Case Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority Urgency
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="High">High Urgency</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Row 3: Court Name & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Court Designation & Jurisdiction *
              </label>
              <input
                type="text"
                name="courtName"
                value={formData.courtName}
                onChange={handleChange}
                placeholder="e.g. Delhi High Court - Commercial Bench 2"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Courtroom / Annex Location
              </label>
              <input
                type="text"
                name="courtroom"
                value={formData.courtroom}
                onChange={handleChange}
                placeholder="e.g. Courtroom 302, Annex Block"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Row 4: Client & Assigned Lawyer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client / Litigant Name *
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="Client Name or Company"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Advocate / Counsel *
              </label>
              <select
                name="assignedLawyer"
                value={formData.assignedLawyer}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {lawyers.map(l => (
                  <option key={l.id} value={l.fullName}>{l.fullName} ({l.specialization})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Filing Date & Next Hearing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Filing Registration Date *
              </label>
              <input
                type="date"
                name="filingDate"
                value={formData.filingDate}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Hearing Date
              </label>
              <input
                type="date"
                name="nextHearingDate"
                value={formData.nextHearingDate}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hearing Time
              </label>
              <input
                type="text"
                name="nextHearingTime"
                value={formData.nextHearingTime}
                onChange={handleChange}
                placeholder="10:30 AM"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Row 6: Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Case Summary & Relief Sought
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="State the primary grounds of litigation, statutory provisions invoked, and specific injunctive or monetary prayers..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/cases')}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#142B4A] hover:bg-[#24466B] text-white rounded-xl font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Register Case</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCase;
