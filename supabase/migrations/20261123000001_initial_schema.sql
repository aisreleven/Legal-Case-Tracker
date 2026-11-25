-- ====================================================================
-- JURISTRACK LEGAL CASE DOCUMENT & HEARING TRACKER
-- MIGRATION 1: INITIAL SCHEMA DEFINITION (ENHANCED SECURITY)
-- ====================================================================

-- 1. Enable Necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Utility Trigger Function: Automatic Updated At Timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. Profiles Table (Linked to Supabase auth.users)
-- profile_image is explicitly nullable with no hardcoded fallback
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'lawyer', 'client')),
  profile_image TEXT,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'inactive')),
  specialization TEXT,
  department TEXT,
  company TEXT,
  bar_council_id TEXT,
  experience TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

-- 4. Cases Table
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  case_type TEXT NOT NULL,
  court_name TEXT NOT NULL,
  court_location TEXT,
  courtroom TEXT,
  judge TEXT,
  filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  progress_stage TEXT NOT NULL DEFAULT 'Initial Case Filing',
  progress_percent INTEGER NOT NULL DEFAULT 20 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  lawyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for cases updated_at
DROP TRIGGER IF EXISTS update_cases_updated_at ON public.cases;
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for rapid case searching and filtering
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON public.cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON public.cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON public.cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_filing_date ON public.cases(filing_date);

-- 5. Hearings Table
CREATE TABLE IF NOT EXISTS public.hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  hearing_date DATE NOT NULL,
  hearing_time TEXT NOT NULL,
  court_name TEXT NOT NULL,
  courtroom TEXT,
  hearing_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'postponed', 'cancelled')),
  outcome TEXT,
  next_hearing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for hearings updated_at
DROP TRIGGER IF EXISTS update_hearings_updated_at ON public.hearings;
CREATE TRIGGER update_hearings_updated_at
  BEFORE UPDATE ON public.hearings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for hearing queries and calendar lookups
CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_hearings_date ON public.hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_status ON public.hearings(status);

-- 6. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('Case Petitions', 'Court Orders', 'Evidence', 'Affidavits', 'Agreements', 'Legal Notices', 'Other Documents')),
  file_path TEXT NOT NULL,
  file_size TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  description TEXT,
  content_snippet TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'system' CHECK (notification_type IN ('hearing', 'case', 'document', 'system')),
  related_case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 8. Case Activities Table
CREATE TABLE IF NOT EXISTS public.case_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_activities_case_id ON public.case_activities(case_id);

-- 9. Audit Logs Table (Immutable security log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 10. Automated Auth User Registration Trigger
-- SECURITY ENHANCEMENTS:
-- - Fixed safe search_path = public, pg_temp to prevent search_path hijacking
-- - SECURITY DEFINER ensures reliable execution in system context
-- - Strictly hardcodes role = 'client'; NEVER trusts user metadata for role
-- - Removed hardcoded Unsplash fallback; profile_image is nullable (defaults to NULL)
-- - Preserves foreign key relationship: id strictly equals NEW.id (auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
  v_avatar TEXT;
BEGIN
  -- Extract full name from auth metadata or derive from email
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Extract phone if provided
  v_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  -- Extract avatar if provided in user metadata; otherwise leave as NULL (no fake URLs)
  v_avatar := NULLIF(
    TRIM(COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'avatar'
    )),
    ''
  );

  -- Every registration strictly receives the default role 'client'
  -- Metadata role values are intentionally ignored for security
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    profile_image,
    account_status
  ) VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    v_phone,
    'client', -- STRICT: Forced client role; self-escalation impossible
    v_avatar, -- Nullable; NULL if no custom image was provided
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    profile_image = COALESCE(EXCLUDED.profile_image, public.profiles.profile_image);

  RETURN NEW;
END;
$$;

-- Recreate trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 11. Trusted Administrative Procedure to promote/assign roles
-- SECURITY ENHANCEMENTS:
-- - Fixed safe search_path = public, pg_temp
-- - Explicit SECURITY DEFINER
-- - REVOKE ALL execution privileges from PUBLIC, anon, and authenticated
-- - GRANT EXECUTE exclusively to service_role and postgres
-- - Prevents any public/client-side RPC role escalation
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF new_role NOT IN ('admin', 'lawyer', 'client') THEN
    RAISE EXCEPTION 'Invalid role: %. Role must strictly be admin, lawyer, or client.', new_role;
  END IF;

  UPDATE public.profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile with ID % not found.', target_user_id;
  END IF;
END;
$$;

-- Revoke default execute permissions from untrusted roles
REVOKE ALL ON FUNCTION public.set_user_role(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_user_role(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.set_user_role(UUID, TEXT) FROM authenticated;

-- Grant execution strictly to database administrators and service_role
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, TEXT) TO service_role;
