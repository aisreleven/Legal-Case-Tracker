-- ====================================================================
-- JURISTRACK LEGAL CASE DOCUMENT & HEARING TRACKER
-- MIGRATION 2: ROW LEVEL SECURITY (RLS) POLICIES
-- FINAL PRODUCTION HARDENING & DEPENDENCY-SAFE EXECUTION ORDER
-- ====================================================================

-- ====================================================================
-- 1. ENSURE ROW LEVEL SECURITY IS ACTIVE ON ALL TABLES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


-- ====================================================================
-- 2. DYNAMICALLY DROP ALL EXISTING POLICIES FROM PG_POLICIES
-- This removes any obsolete, permissive, or legacy policies from prior runs
-- AND eliminates policy dependencies on public functions BEFORE dropping them.
-- Avoids DROP FUNCTION ... CASCADE.
-- ====================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles',
        'cases',
        'hearings',
        'documents',
        'notifications',
        'case_activities',
        'audit_logs'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END;
$$;


-- ====================================================================
-- 3. DROP DEPRECATED PUBLIC FUNCTIONS (CLEANLY WITHOUT CASCADE)
-- Safe to drop now because all dependent policies were dropped in Step 2.
-- ====================================================================
DROP FUNCTION IF EXISTS public.can_access_case(UUID);
DROP FUNCTION IF EXISTS public.is_valid_lawyer(UUID);
DROP FUNCTION IF EXISTS public.is_valid_client(UUID);
DROP FUNCTION IF EXISTS public.get_case_lawyer_id(UUID);
DROP FUNCTION IF EXISTS public.get_case_client_id(UUID);
DROP FUNCTION IF EXISTS public.get_case_created_by(UUID);
DROP FUNCTION IF EXISTS public.get_hearing_case_id(UUID);
DROP FUNCTION IF EXISTS public.get_document_case_id(UUID);
DROP FUNCTION IF EXISTS public.get_document_uploaded_by(UUID);


-- ====================================================================
-- 4. PRIVATE INTERNAL SCHEMA (ZERO PUBLIC RPC EXPOSURE)
-- ====================================================================
CREATE SCHEMA IF NOT EXISTS internal;

-- Explicitly revoke schema usage from PUBLIC and anon before granting selectively.
-- PostgreSQL grants USAGE on the public schema to PUBLIC by default; this ensures
-- the internal schema never inherits that permissive default.
REVOKE ALL ON SCHEMA internal FROM PUBLIC, anon;

-- Grant usage on internal schema so RLS policies can invoke internal functions.
-- Only authenticated sessions and trusted server-side roles may resolve internal.* symbols.
GRANT USAGE ON SCHEMA internal TO authenticated, service_role;


-- ====================================================================
-- 5. ZERO-ARGUMENT CALLER IDENTITY HELPERS (IN PUBLIC SCHEMA)
-- Zero-argument functions operate on auth.uid() and reveal no third-party data.
-- ====================================================================

-- Function 1: Get current authenticated user's role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Function 2: Get current authenticated user's account status safely
CREATE OR REPLACE FUNCTION public.get_current_user_status()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT account_status FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Function 3: Check if caller is an active Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND account_status = 'active'
  );
$$;

-- Function 4: Check if caller is an active Lawyer
CREATE OR REPLACE FUNCTION public.is_lawyer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'lawyer'
      AND account_status = 'active'
  );
$$;

-- Function 5: Check if caller is an active Client
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'client'
      AND account_status = 'active'
  );
$$;

-- Permissions on public identity helpers
REVOKE ALL ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_current_user_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_lawyer() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_client() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_status() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_lawyer() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_client() TO authenticated, service_role;


-- ====================================================================
-- 6. INTERNAL VALIDATION HELPERS (MOVED TO INTERNAL SCHEMA)
-- Protected against PostgREST RPC exposure; cannot be enumerated via HTTP
-- ====================================================================

-- Function 6: Validate that a given UUID belongs to an active Lawyer
CREATE OR REPLACE FUNCTION internal.is_valid_lawyer(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = internal, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
      AND role = 'lawyer'
      AND account_status = 'active'
  );
$$;

-- Function 7: Validate that a given UUID belongs to an active Client
CREATE OR REPLACE FUNCTION internal.is_valid_client(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = internal, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
      AND role = 'client'
      AND account_status = 'active'
  );
$$;

-- Function 8: Verifies if current user is an active, authorized party to a case
CREATE OR REPLACE FUNCTION internal.can_access_case(p_case_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = internal, public, pg_temp
AS $$
BEGIN
  IF p_case_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.cases
    WHERE id = p_case_id
      AND (
        (public.is_lawyer() AND lawyer_id = auth.uid())
        OR (public.is_client() AND client_id = auth.uid())
      )
  );
END;
$$;

-- Permissions on internal schema functions.
-- REVOKE from PUBLIC removes the default execute privilege inherited by all roles.
-- REVOKE from anon is an explicit belt-and-suspenders denial for the anon role,
-- which Supabase/PostgREST uses for unauthenticated API callers.
REVOKE ALL ON FUNCTION internal.is_valid_lawyer(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION internal.is_valid_client(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION internal.can_access_case(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION internal.is_valid_lawyer(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.is_valid_client(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.can_access_case(UUID) TO authenticated, service_role;


-- ====================================================================
-- 7. DATABASE TRIGGERS FOR NULL-SAFE IMMUTABILITY
-- All comparisons strictly use IS DISTINCT FROM to prevent NULL bypasses
-- ====================================================================

-- 7.0 Trigger for Profile Update Restrictions
-- Prevents ordinary authenticated users from promoting their own role or
-- changing their account_status through direct database updates.
--
-- CRITICAL DESIGN NOTE — why SECURITY INVOKER is mandatory here:
--
-- A SECURITY DEFINER trigger function always executes as its OWNER, so
-- current_user inside the body always equals the owner name (e.g. 'postgres').
-- If this function were SECURITY DEFINER, the trusted-role check would be TRUE
-- for every caller — the guard would never fire and any user could freely
-- change their own role or account_status. SECURITY DEFINER is therefore
-- fundamentally incompatible with a current_user identity check.
--
-- SECURITY INVOKER executes in the CALLER's role context, so current_user
-- accurately reflects who triggered the UPDATE:
--   • Normal authenticated API session (PostgREST SET LOCAL ROLE authenticated)
--     → current_user = 'authenticated'  → role/status changes are BLOCKED.
--   • public.set_user_role() — SECURITY DEFINER owned by postgres — does its
--     inner UPDATE while current_user = 'postgres' (the function owner).
--     The trigger inherits that context → changes are ALLOWED.
--   • Direct service_role backend call → current_user = 'service_role' → ALLOWED.
--   • DBA via Supabase SQL Editor → current_user = 'postgres' / 'supabase_admin'
--     → ALLOWED.
--
-- Note: public.set_user_role() already has REVOKE ALL FROM authenticated in
-- Migration 1, so no client session can even call it; this trigger is an
-- independent, engine-level second line of defence.
--
-- No client-controlled session variable or spoofable bypass is used.
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- profiles.id is immutable for every caller without exception.
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Security violation: profiles.id cannot be modified.';
  END IF;

  -- Trusted backend execution contexts: the SECURITY DEFINER owner of
  -- set_user_role() (postgres), direct service_role backend calls, and
  -- direct superuser DBA sessions. All other callers fall through to the
  -- immutability checks below.
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- Block role escalation. No client session may change its own or another
  -- user's role, regardless of which RLS policy permitted the UPDATE row.
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Security violation: profiles.role cannot be changed through a client session. Use the trusted administrative procedure.';
  END IF;

  -- Block account_status manipulation. Suspension and reactivation must only
  -- happen through the trusted administrative workflow (set_user_role /
  -- service_role backend), never through a direct authenticated API call.
  IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
    RAISE EXCEPTION 'Security violation: profiles.account_status cannot be changed through a client session. Use the trusted administrative procedure.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_profile_update ON public.profiles;
CREATE TRIGGER trg_validate_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_update();

-- 7.1 Trigger for Case Immutability
CREATE OR REPLACE FUNCTION public.validate_case_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = internal, public, pg_temp
AS $$
BEGIN
  -- id is immutable
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Security violation: cases.id cannot be modified.';
  END IF;

  -- created_by is strictly immutable for all callers, including admins
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'Security violation: cases.created_by is immutable.';
  END IF;

  -- Lawyers cannot alter lawyer_id, client_id, or case_number
  IF NOT public.is_admin() THEN
    IF NEW.lawyer_id IS DISTINCT FROM OLD.lawyer_id THEN
      RAISE EXCEPTION 'Security violation: Lawyers cannot reassign cases to another advocate.';
    END IF;

    IF NEW.client_id IS DISTINCT FROM OLD.client_id THEN
      RAISE EXCEPTION 'Security violation: Lawyers cannot reassign cases to another client.';
    END IF;

    IF NEW.case_number IS DISTINCT FROM OLD.case_number THEN
      RAISE EXCEPTION 'Security violation: case_number cannot be modified.';
    END IF;
  ELSE
    -- Admin assignment validation
    IF NEW.lawyer_id IS NOT NULL AND NOT internal.is_valid_lawyer(NEW.lawyer_id) THEN
      RAISE EXCEPTION 'Validation error: Assigned lawyer must be an active lawyer profile.';
    END IF;

    IF NEW.client_id IS NOT NULL AND NOT internal.is_valid_client(NEW.client_id) THEN
      RAISE EXCEPTION 'Validation error: Assigned client must be an active client profile.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_case_update ON public.cases;
CREATE TRIGGER trg_validate_case_update
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_case_update();


-- 7.2 Trigger for Document Immutability
CREATE OR REPLACE FUNCTION public.validate_document_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = internal, public, pg_temp
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Security violation: documents.id cannot be modified.';
  END IF;

  -- case_id and uploaded_by are strictly immutable for all users
  IF NEW.case_id IS DISTINCT FROM OLD.case_id THEN
    RAISE EXCEPTION 'Security violation: documents.case_id cannot be modified.';
  END IF;

  IF NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by THEN
    RAISE EXCEPTION 'Security violation: documents.uploaded_by cannot be modified.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_document_update ON public.documents;
CREATE TRIGGER trg_validate_document_update
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_document_update();


-- 7.3 Trigger for Hearing Immutability
CREATE OR REPLACE FUNCTION public.validate_hearing_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = internal, public, pg_temp
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Security violation: hearings.id cannot be modified.';
  END IF;

  -- case_id is strictly immutable
  IF NEW.case_id IS DISTINCT FROM OLD.case_id THEN
    RAISE EXCEPTION 'Security violation: hearings.case_id cannot be modified.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_hearing_update ON public.hearings;
CREATE TRIGGER trg_validate_hearing_update
  BEFORE UPDATE ON public.hearings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_hearing_update();


-- 7.4 Trigger for Notification Update Restrictions
-- Users may only toggle is_read; all other fields are strictly immutable
CREATE OR REPLACE FUNCTION public.validate_notification_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = internal, public, pg_temp
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.notification_type IS DISTINCT FROM OLD.notification_type
     OR NEW.related_case_id IS DISTINCT FROM OLD.related_case_id
     OR NEW.link IS DISTINCT FROM OLD.link
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Security violation: Only the is_read status of a notification may be updated.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_notification_update ON public.notifications;
CREATE TRIGGER trg_validate_notification_update
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_notification_update();


-- ====================================================================
-- 8. SECURE NOTIFICATION RPC FUNCTIONS
-- Strictly checks auth.uid() IS NOT NULL and account_status = 'active'
-- ====================================================================

CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF public.get_current_user_status() IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Access denied: account is not active.';
  END IF;

  UPDATE public.notifications
  SET is_read = TRUE
  WHERE id = p_notification_id
    AND user_id = v_uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF public.get_current_user_status() IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Access denied: account is not active.';
  END IF;

  UPDATE public.notifications
  SET is_read = TRUE
  WHERE user_id = v_uid
    AND is_read = FALSE;
END;
$$;

REVOKE ALL ON FUNCTION
    public.mark_notification_as_read(UUID)
FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION
    public.mark_all_notifications_as_read()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
    public.mark_notification_as_read(UUID)
TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION
    public.mark_all_notifications_as_read()
TO authenticated, service_role;


-- ====================================================================
-- 9. TABLE-LEVEL PERMISSION HARDENING (DEFENSE-IN-DEPTH)
-- Enforces table-level access boundaries alongside RLS policies.
-- ====================================================================

-- 9.1 Audit Logs: Strictly Read-Only for authenticated sessions; zero insert/update/delete/truncate
-- Revoke ALL (including SELECT) first to establish a clean privilege baseline,
-- then selectively restore only SELECT for authenticated users.
REVOKE ALL ON public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role, postgres;

-- 9.2 Case Activities: Append-only for authenticated sessions; zero update/delete/truncate
-- Revoke ALL first to prevent any residual privileges from prior migrations or defaults,
-- then selectively restore only SELECT and INSERT for authenticated users.
REVOKE ALL ON public.case_activities FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.case_activities TO authenticated;
GRANT ALL ON public.case_activities TO service_role, postgres;

-- 9.3 Profiles, Cases, Hearings, Documents, Notifications

REVOKE ALL ON
    public.profiles,
    public.cases,
    public.hearings,
    public.documents,
    public.notifications
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON
    public.profiles,
    public.cases,
    public.hearings,
    public.documents,
    public.notifications
TO authenticated;

GRANT ALL ON
    public.profiles,
    public.cases,
    public.hearings,
    public.documents,
    public.notifications
TO service_role, postgres;


-- ====================================================================
-- 10. RECREATE PROFILES POLICIES
-- ====================================================================

-- 10.1 SELECT: Users view own profile, active Admins view all, active Lawyers/Clients view ONLY counterparts on their cases
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (
      (public.is_lawyer() OR public.is_client())
      AND EXISTS (
        SELECT 1 FROM public.cases c
        WHERE (c.client_id = auth.uid() AND c.lawyer_id = public.profiles.id)
           OR (c.lawyer_id = auth.uid() AND c.client_id = public.profiles.id)
      )
    )
  );

-- 10.2 UPDATE (Self): Users can update details but CANNOT alter role or account_status
-- Suspended users cannot update; uses recursion-free SECURITY DEFINER helpers
CREATE POLICY "profiles_self_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    AND NOT public.is_admin()
    AND public.get_current_user_status() = 'active'
  )
  WITH CHECK (
    id = auth.uid()
    AND role = public.get_current_user_role()
    AND account_status = public.get_current_user_status()
  );

-- 10.3 ADMIN POLICIES: Explicitly separated by operation
CREATE POLICY "profiles_admin_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_delete_policy"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ====================================================================
-- 11. RECREATE CASES POLICIES
-- ====================================================================

-- 11.1 SELECT: Active Admin sees all; active Lawyer sees assigned; active Client sees own
CREATE POLICY "cases_select_policy"
  ON public.cases
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (public.is_lawyer() AND lawyer_id = auth.uid())
    OR (public.is_client() AND client_id = auth.uid())
  );

-- 11.2 INSERT (Admin): Active Admin registers cases with active counterpart profiles
CREATE POLICY "cases_admin_insert_policy"
  ON public.cases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND (lawyer_id IS NULL OR internal.is_valid_lawyer(lawyer_id))
    AND (client_id IS NULL OR internal.is_valid_client(client_id))
    AND (created_by IS NULL OR created_by = auth.uid())
  );

-- 11.3 INSERT (Lawyer): Active Lawyers create cases assigned strictly to themselves
CREATE POLICY "cases_lawyer_insert_policy"
  ON public.cases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_lawyer()
    AND NOT public.is_admin()
    AND lawyer_id = auth.uid()
    AND created_by = auth.uid()
    AND (client_id IS NULL OR internal.is_valid_client(client_id))
  );

-- 11.4 UPDATE (Admin): Active Admin updates cases (field immutability guarded by trg_validate_case_update)
CREATE POLICY "cases_admin_update_policy"
  ON public.cases
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11.5 UPDATE (Lawyer): Active Lawyers update assigned cases (reassignment blocked by trg_validate_case_update)
CREATE POLICY "cases_lawyer_update_policy"
  ON public.cases
  FOR UPDATE
  TO authenticated
  USING (
    public.is_lawyer()
    AND NOT public.is_admin()
    AND lawyer_id = auth.uid()
  )
  WITH CHECK (
    lawyer_id = auth.uid()
  );

-- 11.6 DELETE: Only active Admins can delete cases
CREATE POLICY "cases_admin_delete_policy"
  ON public.cases
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ====================================================================
-- 12. RECREATE HEARINGS POLICIES
-- ====================================================================

-- 12.1 SELECT: Active authorized case participants can view hearings
CREATE POLICY "hearings_select_policy"
  ON public.hearings
  FOR SELECT
  TO authenticated
  USING (internal.can_access_case(case_id));

-- 12.2 INSERT (Admin): Active Admin can schedule hearings for existing cases
CREATE POLICY "hearings_admin_insert_policy"
  ON public.hearings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND EXISTS (SELECT 1 FROM public.cases WHERE id = case_id)
  );

-- 12.3 INSERT (Lawyer): Active assigned lawyer can schedule hearings on their cases
CREATE POLICY "hearings_lawyer_insert_policy"
  ON public.hearings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_lawyer()
    AND NOT public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id AND c.lawyer_id = auth.uid()
    )
  );

-- 12.4 UPDATE (Admin): Active Admin can update hearings (case_id immutable via trigger)
CREATE POLICY "hearings_admin_update_policy"
  ON public.hearings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 12.5 UPDATE (Lawyer): Active assigned lawyer can update hearings on their cases
CREATE POLICY "hearings_lawyer_update_policy"
  ON public.hearings
  FOR UPDATE
  TO authenticated
  USING (
    public.is_lawyer()
    AND NOT public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id AND c.lawyer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id AND c.lawyer_id = auth.uid()
    )
  );

-- 12.6 DELETE: Active Admins and active assigned lawyers can delete hearings
CREATE POLICY "hearings_admin_delete_policy"
  ON public.hearings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "hearings_lawyer_delete_policy"
  ON public.hearings
  FOR DELETE
  TO authenticated
  USING (
    public.is_lawyer()
    AND NOT public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id AND c.lawyer_id = auth.uid()
    )
  );


-- ====================================================================
-- 13. RECREATE DOCUMENTS POLICIES
-- ====================================================================

-- 13.1 SELECT: Only active authorized case participants can view documents
CREATE POLICY "documents_select_policy"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (internal.can_access_case(case_id));

-- 13.2 INSERT: Active authorized case participants can upload documents; uploaded_by must be caller
CREATE POLICY "documents_insert_policy"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    internal.can_access_case(case_id)
    AND uploaded_by = auth.uid()
  );

-- 13.3 UPDATE (Uploader): Uploader can update metadata; case_id and uploaded_by immutable via trigger
CREATE POLICY "documents_user_update_policy"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    AND internal.can_access_case(case_id)
    AND NOT public.is_admin()
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    AND internal.can_access_case(case_id)
  );

-- 13.4 UPDATE (Admin): Active Admin can update document metadata (case_id and uploaded_by immutable via trigger)
CREATE POLICY "documents_admin_update_policy"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 13.5 DELETE: Uploader (with active case access) and active Admins can delete documents
CREATE POLICY "documents_uploader_delete_policy"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    AND internal.can_access_case(case_id)
    AND NOT public.is_admin()
  );

CREATE POLICY "documents_admin_delete_policy"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ====================================================================
-- 14. RECREATE NOTIFICATIONS POLICIES
-- ====================================================================

-- 14.1 SELECT: Users can only read their own notifications (requires active status)
CREATE POLICY "notifications_select_policy"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.get_current_user_status() = 'active'
  );

-- 14.2 UPDATE: Users can only update their own notifications
-- Protected fields are immutable via trg_validate_notification_update
CREATE POLICY "notifications_update_policy"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.get_current_user_status() = 'active'
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- 14.3 DELETE: Active users can delete their own notifications
CREATE POLICY "notifications_delete_policy"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.get_current_user_status() = 'active'
  );

-- 14.4 INSERT: Strict relationship and type validation
CREATE POLICY "notifications_insert_policy"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin authority
    public.is_admin()
    -- Lawyer notifying assigned Client
    OR (
      public.is_lawyer()
      AND related_case_id IS NOT NULL
      AND notification_type IN ('hearing', 'case', 'document')
      AND EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id = notifications.related_case_id
          AND c.lawyer_id = auth.uid()
          AND c.client_id = notifications.user_id
      )
    )
    -- Client notifying assigned Lawyer
    OR (
      public.is_client()
      AND related_case_id IS NOT NULL
      AND notification_type IN ('case', 'document')
      AND EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id = notifications.related_case_id
          AND c.client_id = auth.uid()
          AND c.lawyer_id = notifications.user_id
      )
    )
    -- Lawyer self-reminder on assigned case
    OR (
      public.is_lawyer()
      AND user_id = auth.uid()
      AND related_case_id IS NOT NULL
      AND notification_type IN ('hearing', 'case', 'document')
      AND EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id = notifications.related_case_id
          AND c.lawyer_id = auth.uid()
      )
    )
    -- Client self-reminder on assigned case
    OR (
      public.is_client()
      AND user_id = auth.uid()
      AND related_case_id IS NOT NULL
      AND notification_type IN ('case', 'document')
      AND EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id = notifications.related_case_id
          AND c.client_id = auth.uid()
      )
    )
  );


-- ====================================================================
-- 15. RECREATE CASE ACTIVITIES POLICIES (APPEND-ONLY JOURNAL)
-- ====================================================================

-- 15.1 SELECT: Only active authorized case participants can read activities
CREATE POLICY "case_activities_select_policy"
  ON public.case_activities
  FOR SELECT
  TO authenticated
  USING (internal.can_access_case(case_id));

-- 15.2 INSERT (Admin): Active Admins can record case activities; user_id must be caller
CREATE POLICY "case_activities_admin_insert_policy"
  ON public.case_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.cases WHERE id = case_id)
  );

-- 15.3 INSERT (Lawyer): Active assigned lawyers can record activities on their cases
CREATE POLICY "case_activities_lawyer_insert_policy"
  ON public.case_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_lawyer()
    AND NOT public.is_admin()
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_activities.case_id AND c.lawyer_id = auth.uid()
    )
  );

-- 15.4 INSERT (Client): Active clients can ONLY record non-procedural activity types
CREATE POLICY "case_activities_client_insert_policy"
  ON public.case_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_client()
    AND NOT public.is_admin()
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_activities.case_id AND c.client_id = auth.uid()
    )
    AND activity_type IN ('Client Note', 'Client Inquiry', 'Document Uploaded')
  );

-- 15.5 IMMUTABILITY: ZERO UPDATE OR DELETE POLICIES EXIST.
-- Case activities are an immutable, append-only procedural journal.
-- Authenticated users (including admins) cannot edit or delete activity records.


-- ====================================================================
-- 16. RECREATE AUDIT LOGS POLICIES (IMMUTABLE AUDIT TRAIL)
-- ====================================================================

-- 16.1 SELECT: Strictly active Admins can inspect audit logs
CREATE POLICY "audit_logs_select_policy"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 16.2 IMMUTABILITY: ZERO INSERT, UPDATE, OR DELETE POLICIES FOR AUTHENTICATED SESSIONS.
-- Normal authenticated users and admins have NO insert, update, or delete privileges.
-- Trusted server-side operations insert audit records using service_role (which bypasses RLS).
