import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Scale, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const EditCase = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, updateCase, users } = useApp();

  const lawyers = users.filter(u => u.role === 'Lawyer');
  const clients = users.filter(u => u.role === 'Client');

  const existingCase = cases.find(c => c.id === id || c.caseNumber === id);

  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    category: '',
    courtName: '',
    courtroom: '',
    clientName: '',
    assignedLawyer: '',
    filingDate: '',
    nextHearingDate: '',
    nextHearingTime: '',
    status: 'Active',
    priority: 'Medium',
    description: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (existingCase) {
      setFormData({
        caseNumber: existingCase.caseNumber || '',
        title: existingCase.title || '',
        category: existingCase.category || 'Civil Property Dispute',
        courtName: existingCase.courtName || '',
        courtroom: existingCase.courtroom || '',
        clientName: existingCase.clientName || '',
        assignedLawyer: existingCase.assignedLawyer || '',
        filingDate: existingCase.filingDate || '',
        nextHearingDate: existingCase.nextHearingDate || '',
        nextHearingTime: existingCase.nextHearingTime || '10:30 AM',
        status: existingCase.status || 'Active',
        priority: existingCase.priority || 'Medium',
        description: existingCase.description || '',
      });
    }
  }, [existingCase]);

  if (!existingCase) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-[#142B4A] dark:text-white">Case Not Found</h2>
        <button onClick={() => navigate('/cases')} className="mt-4 px-4 py-2 bg-[#142B4A] text-white rounded-xl text-xs">
          Return to Cases
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a valid case title.');
      return;
    }

    updateCase(existingCase.id, formData);
    navigate(`/cases/${existingCase.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/cases/${existingCase.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#142B4A] dark:hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Profile</span>
        </button>

        <span className="text-xs text-slate-400">Editing Docket #{existingCase.caseNumber}</span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-sky-300 rounded-2xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#142B4A] dark:text-white">
              Update Case Information
            </h1>
            <p className="text-xs text-slate-500">
              Modify docket records, status transitions, and courtroom assignment details
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Case Docket Number (Read-only)
              </label>
              <input
                type="text"
                name="caseNumber"
                value={formData.caseNumber}
                readOnly
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-500 cursor-not-allowed"
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
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Case Category
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
                Case Status
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
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Court Designation
              </label>
              <input
                type="text"
                name="courtName"
                value={formData.courtName}
                onChange={handleChange}
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
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Name
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Advocate
              </label>
              <select
                name="assignedLawyer"
                value={formData.assignedLawyer}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {lawyers.map(l => (
                  <option key={l.id} value={l.fullName}>{l.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Case Summary / Grounds
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/cases/${existingCase.id}`)}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#142B4A] hover:bg-[#24466B] text-white rounded-xl font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCase;
