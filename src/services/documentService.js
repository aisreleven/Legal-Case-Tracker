import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const BUCKET_NAME = 'legal-documents';

export const documentService = {
  // Get all documents accessible to the current user
  async getDocuments({ category = 'All', search = '' } = {}) {
    if (!isSupabaseConfigured) return { data: [], error: null };

    let query = supabase
      .from('documents')
      .select(`
        *,
        case:cases!documents_case_id_fkey(id, case_number, title),
        uploader:profiles!documents_uploaded_by_fkey(id, full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('document_type', category);
    }

    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`document_name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;
    return { data: data || [], error };
  },

  // Upload file to Supabase Storage and register database record
  async uploadDocument({ file, title, caseId, category, description }) {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return { data: null, error: new Error('User authentication required for document upload.') };
    }

    // 1. Client-Side Size & Type Validation
    const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
    if (file && file.size > MAX_SIZE) {
      return { data: null, error: new Error('File exceeds the 25MB maximum limit.') };
    }

    const ALLOWED_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (file && file.type && !ALLOWED_TYPES.includes(file.type)) {
      return { data: null, error: new Error('Unsupported file format. Please upload PDF, Word document, or JPG/PNG image.') };
    }

    // 2. Upload to Storage
    let filePath = `${caseId}/${Date.now()}_${file ? file.name.replace(/\s+/g, '_') : 'document.pdf'}`;

    if (file) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (storageError) {
        return { data: null, error: storageError };
      }
    }

    // 3. Register database record
    const fileSizeFormatted = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB';

    const payload = {
      case_id: caseId,
      uploaded_by: user.user.id,
      document_name: title || file?.name || 'Legal Document',
      document_type: category || 'Case Petitions',
      file_path: filePath,
      file_size: fileSizeFormatted,
      file_size_bytes: file ? file.size : 1887436,
      mime_type: file?.type || 'application/pdf',
      description: description || 'Certified legal filing',
      content_snippet: `CONFIDENTIAL LEGAL RECORD\nTitle: ${title}\nCase ID: ${caseId}\nTimestamp: ${new Date().toISOString()}`
    };

    const { data, error } = await supabase
      .from('documents')
      .insert([payload])
      .select('*, case:cases(id, case_number, title)')
      .single();

    if (!error && data) {
      // Activity
      await supabase.from('case_activities').insert([
        {
          case_id: caseId,
          user_id: user.user.id,
          activity_type: 'Document Uploaded',
          description: `Document "${payload.document_name}" (${payload.document_type}) uploaded.`,
        },
      ]);
    }

    return { data, error };
  },

  // Generate short-lived signed URL for authorized viewing/downloading
  async getSignedUrl(filePath, expiresIn = 300) {
    if (!isSupabaseConfigured) return { url: null, error: new Error('Supabase not configured') };

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    return { url: data?.signedUrl || null, error };
  },

  // Delete document
  async deleteDocument(id, filePath) {
    if (!isSupabaseConfigured) return { error: null };

    // 1. Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (dbError) return { error: dbError };

    // 2. Delete from storage if file path exists
    if (filePath) {
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    }

    return { error: null };
  }
};
