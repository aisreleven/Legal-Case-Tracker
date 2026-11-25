
-- ====================================================================
-- JURISTRACK
-- MIGRATION 3: SUPABASE STORAGE SECURITY
-- ====================================================================

BEGIN;

-- 1. ENSURE BUCKET EXISTS AND IS PRIVATE

UPDATE storage.buckets
SET public = FALSE
WHERE id = 'legal-documents';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM storage.buckets
        WHERE id = 'legal-documents'
    ) THEN
        RAISE EXCEPTION
            'Storage bucket legal-documents does not exist.';
    END IF;
END;
$$;


-- 2. ADD DOCUMENT SHARING CONTROL

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN
NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_documents_shared
ON public.documents(case_id, is_shared);


-- 3. SECURE DOCUMENT SHARING RPC
-- Only an admin or the lawyer assigned to the case
-- can share or unshare a document.

CREATE OR REPLACE FUNCTION public.set_document_shared(
    p_document_id UUID,
    p_is_shared BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $function$
DECLARE
    v_case_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT case_id
    INTO v_case_id
    FROM public.documents
    WHERE id = p_document_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found.';
    END IF;

    IF NOT (
        public.is_admin()
        OR (
            public.is_lawyer()
            AND internal.can_access_case(v_case_id)
        )
    ) THEN
        RAISE EXCEPTION
            'Only an admin or assigned lawyer can change document sharing.';
    END IF;

    UPDATE public.documents
    SET is_shared = p_is_shared
    WHERE id = p_document_id;
END;
$function$;

REVOKE ALL ON FUNCTION
public.set_document_shared(UUID, BOOLEAN)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.set_document_shared(UUID, BOOLEAN)
TO authenticated, service_role;


-- 4. REMOVE OLD STORAGE POLICIES

DROP POLICY IF EXISTS legal_documents_select_policy
ON storage.objects;

DROP POLICY IF EXISTS legal_documents_upload_policy
ON storage.objects;

DROP POLICY IF EXISTS legal_documents_delete_policy
ON storage.objects;


-- 5. SECURE DOCUMENT UPLOAD
-- Path: CASE_ID/DOCUMENT_ID/filename
-- Only admins and assigned lawyers can upload.

CREATE POLICY legal_documents_upload_policy
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'legal-documents'

    AND CASE
        WHEN
            array_length(storage.foldername(name), 1) = 2
            AND (storage.foldername(name))[1]
                ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND (storage.foldername(name))[2]
                ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN
            (
                public.is_admin()
                OR (
                    public.is_lawyer()
                    AND internal.can_access_case(
                        ((storage.foldername(name))[1])::uuid
                    )
                )
            )
        ELSE FALSE
    END
);


-- 6. SECURE DOCUMENT VIEW / DOWNLOAD
-- Admin: all documents.
-- Lawyer: documents of assigned cases.
-- Client: only explicitly shared documents.

CREATE POLICY legal_documents_select_policy
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'legal-documents'

    AND CASE
        WHEN
            array_length(storage.foldername(name), 1) = 2
            AND (storage.foldername(name))[1]
                ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND (storage.foldername(name))[2]
                ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN
            EXISTS (
                SELECT 1
                FROM public.documents d
                WHERE d.id =
                    ((storage.foldername(name))[2])::uuid
                AND d.case_id =
                    ((storage.foldername(name))[1])::uuid
                AND d.file_path = name
                AND (
                    public.is_admin()
                    OR (
                        public.is_lawyer()
                        AND internal.can_access_case(d.case_id)
                    )
                    OR (
                        public.is_client()
                        AND d.is_shared = TRUE
                        AND internal.can_access_case(d.case_id)
                    )
                )
            )
        ELSE FALSE
    END
);


-- 7. SECURE DOCUMENT DELETE
-- Admins can delete any case document.
-- Assigned lawyers can delete documents in their cases.

CREATE POLICY legal_documents_delete_policy
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'legal-documents'

    AND CASE
        WHEN
            array_length(storage.foldername(name), 1) = 2
            AND (storage.foldername(name))[1]
                ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND (storage.foldername(name))[2]
                ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN
            EXISTS (
                SELECT 1
                FROM public.documents d
                WHERE d.id =
                    ((storage.foldername(name))[2])::uuid
                AND d.case_id =
                    ((storage.foldername(name))[1])::uuid
                AND d.file_path = name
                AND (
                    public.is_admin()
                    OR (
                        public.is_lawyer()
                        AND internal.can_access_case(d.case_id)
                    )
                )
            )
        ELSE FALSE
    END
);

COMMIT;

-- ====================================================================
-- END OF MIGRATION 3
-- ====================================================================
