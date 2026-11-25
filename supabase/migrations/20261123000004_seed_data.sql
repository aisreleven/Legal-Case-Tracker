
-- ====================================================================
-- JURISTRACK
-- MIGRATION 4: SECURE ADMINISTRATIVE ROLE ASSIGNMENT
-- NO FAKE USERS / NO DUMMY DATA
-- ====================================================================

BEGIN;

-- ==========================================================
-- 1. PROMOTE AN EXISTING VERIFIED USER TO ADMIN
-- ==========================================================

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(
    target_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user_id UUID;
    v_status TEXT;
    v_email_confirmed_at TIMESTAMPTZ;
BEGIN

    IF target_email IS NULL OR TRIM(target_email) = '' THEN
        RAISE EXCEPTION 'A valid email address is required.';
    END IF;

    SELECT
        p.id,
        p.account_status,
        u.email_confirmed_at
    INTO
        v_user_id,
        v_status,
        v_email_confirmed_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE LOWER(p.email) = LOWER(TRIM(target_email));

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION
            'User not found. Register through the application first.';
    END IF;

    IF v_email_confirmed_at IS NULL THEN
        RAISE EXCEPTION
            'User email must be verified before promotion.';
    END IF;

    IF v_status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION
            'Only active users can be promoted.';
    END IF;

    UPDATE public.profiles
    SET
        role = 'admin',
        updated_at = NOW()
    WHERE id = v_user_id;

    RETURN 'SUCCESS: User promoted to Administrator.';

END;
$function$;


-- ==========================================================
-- 2. ASSIGN LAWYER ROLE TO AN EXISTING VERIFIED USER
-- ==========================================================

CREATE OR REPLACE FUNCTION public.assign_lawyer_role(
    target_email TEXT,
    p_specialization TEXT DEFAULT 'Corporate & Civil Litigation',
    p_bar_council_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user_id UUID;
    v_status TEXT;
    v_email_confirmed_at TIMESTAMPTZ;
BEGIN

    IF target_email IS NULL OR TRIM(target_email) = '' THEN
        RAISE EXCEPTION 'A valid email address is required.';
    END IF;

    SELECT
        p.id,
        p.account_status,
        u.email_confirmed_at
    INTO
        v_user_id,
        v_status,
        v_email_confirmed_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE LOWER(p.email) = LOWER(TRIM(target_email));

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION
            'User not found. Register through the application first.';
    END IF;

    IF v_email_confirmed_at IS NULL THEN
        RAISE EXCEPTION
            'User email must be verified before lawyer assignment.';
    END IF;

    IF v_status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION
            'Only active users can become lawyers.';
    END IF;

    UPDATE public.profiles
    SET
        role = 'lawyer',
        specialization = COALESCE(
            NULLIF(TRIM(p_specialization), ''),
            specialization,
            'Corporate & Civil Litigation'
        ),
        bar_council_id = COALESCE(
            NULLIF(TRIM(p_bar_council_id), ''),
            bar_council_id
        ),
        updated_at = NOW()
    WHERE id = v_user_id;

    RETURN 'SUCCESS: Lawyer role assigned.';

END;
$function$;


-- ==========================================================
-- 3. ENSURE TRUSTED FUNCTION OWNERSHIP
-- ==========================================================

ALTER FUNCTION public.promote_user_to_admin(TEXT)
OWNER TO postgres;

ALTER FUNCTION public.assign_lawyer_role(TEXT, TEXT, TEXT)
OWNER TO postgres;


-- ==========================================================
-- 4. RESTRICT FUNCTION EXECUTION
-- ==========================================================

REVOKE ALL ON FUNCTION
public.promote_user_to_admin(TEXT)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
public.assign_lawyer_role(TEXT, TEXT, TEXT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.promote_user_to_admin(TEXT)
TO postgres, service_role;

GRANT EXECUTE ON FUNCTION
public.assign_lawyer_role(TEXT, TEXT, TEXT)
TO postgres, service_role;

COMMIT;

-- ====================================================================
-- END OF MIGRATION 4
-- ====================================================================
