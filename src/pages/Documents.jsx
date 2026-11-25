import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  FileCode,
  Image as ImageIcon,
  FileCheck2,
  Briefcase,
  AlertCircle,
  ExternalLink,
  X,
  UploadCloud
} from 'lucide-react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';

const Documents = () => {
  const { documents, cases, addDocument, deleteDocument, downloadDocument, currentUser } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    caseId: cases[0]?.id || '',
    category: 'Case Petitions',
    fileType: 'pdf',
    fileName: '',
    fileSize: '2.4 MB',
    description: ''
  });

  const categories = [
    'All',
    'Case Petitions',
    'Court Orders',
    'Evidence',
    'Affidavits',
    'Agreements',
    'Legal Notices',
    'Other Documents'
  ];

  // Counts
  const totalCount = documents.length;
  const pdfCount = documents.filter(d => d.fileType === 'pdf').length;
  const wordCount = documents.filter(d => d.fileType === 'docx' || d.fileType === 'doc').length;
  const recentCount = documents.filter(d => d.uploadDate?.startsWith('2024') || d.uploadDate?.startsWith('2026')).length;

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(d => {
      // Role filtering if client
      if (currentUser?.role === 'Client') {
        // Can view shared documents for client's cases
        const clientCases = cases.filter(c => c.clientId === currentUser?.id || c.clientName?.includes(currentUser?.fullName));
        const clientCaseIds = clientCases.map(c => c.id);
        const isClientDoc = clientCaseIds.includes(d.caseId) || d.uploadedBy?.includes(currentUser?.fullName || 'Client');
        if (!isClientDoc) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          d.title.toLowerCase().includes(q) ||
          d.caseNumber?.toLowerCase().includes(q) ||
          d.uploadedBy?.toLowerCase().includes(q) ||
          d.category?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedCategory !== 'All' && d.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [documents, searchQuery, selectedCategory, cases, currentUser]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const extension = file.name.split('.').pop().toLowerCase();
      const mappedType = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(extension)
        ? (extension.startsWith('doc') ? 'docx' : extension.startsWith('jp') ? 'jpg' : extension)
        : 'pdf';

      setUploadForm(prev => ({
        ...prev,
        file: file,
        fileName: file.name,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
        fileType: mappedType,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      }));
      setShowUploadModal(true);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const extension = file.name.split('.').pop().toLowerCase();
      const mappedType = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(extension)
        ? (extension.startsWith('doc') ? 'docx' : extension.startsWith('jp') ? 'jpg' : extension)
        : 'pdf';

      setUploadForm(prev => ({
        ...prev,
        file: file,
        fileName: file.name,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
        fileType: mappedType,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      }));
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) return;

    const targetCase = cases.find(c => c.id === uploadForm.caseId) || cases[0];

    addDocument({
      file: uploadForm.file,
      title: uploadForm.title,
      caseId: targetCase.id,
      caseNumber: targetCase.caseNumber,
      caseTitle: targetCase.title,
      category: uploadForm.category,
      fileType: uploadForm.fileType,
      fileSize: uploadForm.fileSize || "1.8 MB",
      description: uploadForm.description || "Uploaded to secure vault.",
      contentSnippet: `LEGAL FILING: ${uploadForm.title.toUpperCase()}\nDocket Reference: ${targetCase.caseNumber} (${targetCase.title})\nCategory: ${uploadForm.category}\nVerification: In-browser judicial sandbox authenticated.`
    });

    setShowUploadModal(false);
    setUploadForm({
      file: null,
      title: '',
      caseId: cases[0]?.id || '',
      category: 'Case Petitions',
      fileType: 'pdf',
      fileName: '',
      fileSize: '2.4 MB',
      description: ''
    });
  };

  const confirmDelete = () => {
    if (docToDelete) {
      deleteDocument(docToDelete.id, docToDelete.filePath);
      setDocToDelete(null);
    }
  };

  const columns = [
    {
      header: 'Document Name & Description',
      accessor: 'title',
      render: (row) => (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-gold flex-shrink-0 mt-0.5">
            {row.fileType === 'pdf' ? (
              <FileText className="w-4 h-4 text-rose-500" />
            ) : row.fileType === 'docx' ? (
              <FileCode className="w-4 h-4 text-blue-500" />
            ) : (
              <ImageIcon className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div>
            <p className="font-bold text-[#142B4A] dark:text-white max-w-sm">{row.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{row.description || 'Certified legal filing'}</p>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Associated Case',
      accessor: 'caseNumber',
      render: (row) => (
        <div>
          <button
            onClick={() => navigate(`/cases/${row.caseId || 'case-001'}`)}
            className="font-bold text-[#142B4A] dark:text-gold hover:underline flex items-center gap-1"
          >
            <span>{row.caseNumber || 'CIV-2024-8841'}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
          <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">{row.caseTitle}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
          {row.category}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Uploaded By',
      accessor: 'uploadedBy',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{row.uploadedBy}</span>
      ),
      sortable: true
    },
    {
      header: 'Date & Size',
      accessor: 'uploadDate',
      render: (row) => (
        <div>
          <span className="text-xs font-mono text-slate-700 dark:text-slate-300 block">{row.uploadDate}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">{row.fileSize} • {row.fileType?.toUpperCase()}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setPreviewDoc(row)}
            className="p-1.5 text-slate-500 hover:text-[#142B4A] dark:hover:text-gold rounded-lg hover:bg-slate-100 transition-colors"
            title="Preview Document"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => downloadDocument(row)}
            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
            title="Download Document"
          >
            <Download className="w-4 h-4" />
          </button>

          {currentUser?.role !== 'Client' && (
            <button
              onClick={() => setDocToDelete(row)}
              className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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
            Legal Document Repository & Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Certified petitions, affidavits, forensic evidence, and High Court decrees
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-[#142B4A] hover:bg-[#24466B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Documents"
          value={totalCount}
          subtitle="All repository files"
          icon={FileText}
          accentColor="primary"
        />
        <StatCard
          title="PDF Documents"
          value={pdfCount}
          subtitle="Court petitions & decrees"
          icon={FileText}
          accentColor="gold"
        />
        <StatCard
          title="Word Documents"
          value={wordCount}
          subtitle="Pleadings & draft contracts"
          icon={FileCode}
          accentColor="emerald"
        />
        <StatCard
          title="Recently Uploaded"
          value={recentCount}
          subtitle="Indexed in active dockets"
          icon={FileCheck2}
          accentColor="amber"
        />
      </div>

      {/* Drag & Drop Upload Zone Card */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all bg-white dark:bg-slate-900 ${
          dragActive
            ? 'border-[#C6A15B] bg-[#C6A15B]/5 scale-[1.01]'
            : 'border-[#E5EAF0] dark:border-slate-800 hover:border-slate-400'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950 dark:text-gold flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#142B4A] dark:text-white">
            Drag & Drop Legal Records Here
          </h3>
          <p className="text-xs text-slate-500">
            Supports PDF, DOC, DOCX, JPG, and PNG files up to 25MB for court presentation
          </p>
          <div className="pt-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#142B4A] hover:bg-[#24466B] text-white text-xs font-bold rounded-xl transition-colors">
              <span>Browse Computer</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileInputChange}
              />
            </label>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            * Browser demonstration mode: files are indexed securely in local application session.
          </p>
        </div>
      </div>

      {/* Categories Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-[#142B4A] text-white shadow-sm font-semibold'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAF0] dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search documents by title, case number, or author..."
          />
        </div>
      </div>

      {/* Documents Data Table */}
      <DataTable
        columns={columns}
        data={filteredDocuments}
        pageSize={8}
        onRowClick={(row) => setPreviewDoc(row)}
        emptyMessage="No documents found in the current category."
      />

      {/* Preview Document Modal */}
      <Modal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title="Document Previewer"
        subtitle={previewDoc?.title}
        maxWidth="max-w-2xl"
      >
        {previewDoc && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Format</span>
                <span className="font-bold text-[#142B4A] dark:text-gold uppercase">{previewDoc.fileType} • {previewDoc.fileSize}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Case Docket</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{previewDoc.caseNumber}</span>
              </div>
            </div>

            {/* Document Authentic Snippet */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed max-h-72 overflow-y-auto border border-slate-800">
              <div className="text-slate-400 pb-2 mb-2 border-b border-slate-800 text-[10px] flex items-center justify-between">
                <span>AUTHENTIC COURT TRANSCRIPT PREVIEW</span>
                <span>VERIFIED SEAL</span>
              </div>
              <pre className="whitespace-pre-wrap">{previewDoc.contentSnippet || 'Full verified legal document record stored in digital evidence locker.'}</pre>
            </div>

            <p className="text-slate-500 text-xs">
              Uploaded on {previewDoc.uploadDate} by <strong>{previewDoc.uploadedBy}</strong>. Category: {previewDoc.category}.
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  navigate(`/cases/${previewDoc.caseId || 'case-001'}`);
                  setPreviewDoc(null);
                }}
                className="text-[#142B4A] dark:text-gold font-bold hover:underline flex items-center gap-1"
              >
                <span>View Associated Case File</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadDocument(previewDoc)}
                  className="px-4 py-2 bg-[#142B4A] hover:bg-[#24466B] text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Legal Document to Docket"
        subtitle="Attach court pleadings, evidence affidavits or judgment orders"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Document Title *</label>
            <input
              type="text"
              value={uploadForm.title}
              onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Certified Sale Deed & Boundary Demarcation"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Associated Case *</label>
              <select
                value={uploadForm.caseId}
                onChange={(e) => setUploadForm(prev => ({ ...prev, caseId: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">File Type</label>
              <select
                value={uploadForm.fileType}
                onChange={(e) => setUploadForm(prev => ({ ...prev, fileType: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="pdf">PDF Document (.pdf)</option>
                <option value="docx">Word File (.docx)</option>
                <option value="jpg">Image Document (.jpg)</option>
                <option value="png">PNG Graphic (.png)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Simulated Size</label>
              <input
                type="text"
                value={uploadForm.fileSize}
                onChange={(e) => setUploadForm(prev => ({ ...prev, fileSize: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Document Description</label>
            <textarea
              rows={2}
              value={uploadForm.description}
              onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Summary of certified contents..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#142B4A] hover:bg-[#24466B] text-white font-bold rounded-xl"
            >
              Upload Document
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        title="Confirm Document Deletion"
        subtitle="This action will delete the document from the repository."
      >
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Are you sure you want to delete <strong>{docToDelete?.title}</strong>?
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setDocToDelete(null)}
            className="px-4 py-2 border rounded-xl text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
          >
            Confirm Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Documents;
