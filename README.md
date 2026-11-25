# JurisTrack - Legal Case Document & Hearing Tracker
### Full-Stack LegalTech Management Platform (React + Supabase + PostgreSQL)

**JurisTrack** is an enterprise-grade LegalTech Software-as-a-Service (SaaS) web application. It connects Judicial Administrators, Advocates/Lawyers, and Litigant Clients to collaboratively manage legal cases, court hearing schedules, evidence documents, notifications, and procedural milestones.

---

## 🏛️ Project Architecture

- **Frontend:** React 18, Vite 5, Tailwind CSS v3, React Router DOM v6, Lucide React Icons, Recharts
- **Backend & Database:** Supabase PostgreSQL, Supabase Auth, Supabase Storage
- **Security:** PostgreSQL Row Level Security (RLS) on every table, authenticated private storage bucket with signed URLs

```
legal-case-tracker/
├── supabase/
│   └── migrations/
│       ├── 20261123000001_initial_schema.sql       # Tables, triggers, indexes & auth user trigger
│       ├── 20261123000002_row_level_security.sql   # RLS policies for Admin, Lawyer, Client
│       ├── 20261123000003_storage_setup.sql        # Private 'legal-documents' bucket & storage RLS
│       └── 20261123000004_seed_data.sql            # Seed dataset for demo dockets & hearings
├── src/
│   ├── lib/
│   │   └── supabaseClient.js                       # Reusable Supabase client with fallback
│   ├── services/
│   │   ├── authService.js                          # Real Supabase Auth (Sign up, In, Out, Reset)
│   │   ├── caseService.js                          # Case CRUD, filtering, assignment & activities
│   │   ├── hearingService.js                       # Cause list scheduling, calendar & outcomes
│   │   ├── documentService.js                      # Storage upload, signed URLs & metadata
│   │   ├── notificationService.js                 # Database-backed alerts & unread counters
│   │   ├── userService.js                          # User governance & account status toggles
│   │   └── reportService.js                        # PostgreSQL analytics & Recharts aggregations
│   ├── context/
│   │   └── AppContext.jsx                          # Central state & Supabase data sync
│   ├── data/
│   │   └── mockData.js                             # Fallback mock data when Supabase is not connected
│   └── ... (Components, Pages, Layouts)
├── .env.example                                    # Environment variable documentation
├── .env                                            # Local environment variables
└── package.json
```

---

## 🔐 Database Schema & Tables

1. **`profiles`**
   - `id (UUID, references auth.users)`
   - `full_name`, `email`, `phone`, `role ('admin' | 'lawyer' | 'client')`
   - `profile_image`, `account_status ('active' | 'suspended' | 'inactive')`
   - `specialization`, `department`, `company`, `bar_council_id`, `experience`, `bio`
   - `created_at`, `updated_at`

2. **`cases`**
   - `id (UUID)`, `case_number (UNIQUE)`, `title`, `description`
   - `case_type`, `court_name`, `court_location`, `courtroom`, `judge`
   - `filing_date`, `status ('active' | 'pending' | 'closed' | 'archived')`
   - `priority ('high' | 'medium' | 'low')`, `progress_stage`, `progress_percent`
   - `lawyer_id (UUID -> profiles)`, `client_id (UUID -> profiles)`, `created_by (UUID -> profiles)`

3. **`hearings`**
   - `id (UUID)`, `case_id (UUID -> cases)`
   - `hearing_date`, `hearing_time`, `court_name`, `courtroom`, `hearing_type`
   - `description`, `status ('scheduled' | 'completed' | 'postponed' | 'cancelled')`
   - `outcome`, `next_hearing_date`

4. **`documents`**
   - `id (UUID)`, `case_id (UUID -> cases)`, `uploaded_by (UUID -> profiles)`
   - `document_name`, `document_type`, `file_path`, `file_size`, `mime_type`
   - `description`, `content_snippet`, `downloads`

5. **`notifications`**
   - `id (UUID)`, `user_id (UUID -> profiles)`, `title`, `message`
   - `notification_type ('hearing' | 'case' | 'document' | 'system')`
   - `related_case_id (UUID -> cases)`, `link`, `is_read (BOOLEAN)`

6. **`case_activities`**
   - `id (UUID)`, `case_id (UUID -> cases)`, `user_id (UUID -> profiles)`
   - `activity_type`, `description`, `created_at`

7. **`audit_logs`**
   - `id (UUID)`, `actor_id (UUID -> profiles)`, `action`, `resource_type`, `resource_id`, `metadata (JSONB)`

---

## 🛡️ Row Level Security (RLS) Policies

All tables have RLS enabled with strict PostgreSQL policies:

- **Admin:** Unrestricted read, insert, update, and deletion across all dockets, hearings, documents, users, and audit logs.
- **Lawyer / Advocate:**
  - Cases: Access only cases where `lawyer_id = auth.uid()` or `created_by = auth.uid()`.
  - Hearings: Create, reschedule, and manage hearings for assigned cases.
  - Documents: View and upload evidence/pleadings for assigned cases.
  - Profiles: Cannot modify another user's role or account status.
- **Client / Litigant:**
  - Cases: Strictly view-only access to cases where `client_id = auth.uid()`.
  - Hearings: View hearing schedule for their cases only.
  - Documents: Download shared court orders and upload authorized case files.
  - User Profiles: Read-only access to their assigned counsel's public profile.

---

## 📁 Storage Configuration (Supabase Storage)

- **Bucket Name:** `legal-documents`
- **Visibility:** `public = false` (Private bucket; files are never publicly addressable).
- **Security:** Access is governed via authenticated signed URLs with 5-minute expiration (`createSignedUrl`).
- **Allowed MIME Types:** PDF (`application/pdf`), Word (`application/msword`, `docx`), Images (`image/jpeg`, `image/png`).
- **File Size Limit:** 25MB maximum per upload.

---

## ⚙️ Supabase Setup & Execution Instructions

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Under **Project Settings -> API**, copy:
   - **Project URL**
   - **anon / public key**

### Step 2: Configure Environment Variables
In your local project root, update `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Step 3: Run Database Migrations in Supabase
In your Supabase Dashboard, go to **SQL Editor -> New Query**, and execute the migration files in this exact sequence:
1. `supabase/migrations/20261123000001_initial_schema.sql` (Creates tables, triggers, and automated user profile sync)
2. `supabase/migrations/20261123000002_row_level_security.sql` (Enables RLS and creates all security policies)
3. `supabase/migrations/20261123000003_storage_setup.sql` (Creates private `legal-documents` bucket and policies)
4. `supabase/migrations/20261123000004_seed_data.sql` (Optional: Populates demo cases, hearings, and documents)

---

## 🚀 Running the Frontend

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Compile production build
npm run build
```
Open your browser at `http://localhost:5173`.
