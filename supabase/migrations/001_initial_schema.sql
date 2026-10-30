-- =============================================================================
-- AHEAD Platform — Complete Supabase Migration
-- File:        001_initial_schema.sql
-- Description: All tables · indexes · triggers · functions · RLS policies
--              · seed data for Supabase Cloud PostgreSQL
-- Apply via:   node scripts/migrate.js  (see /scripts/migrate.js)
--              OR paste directly into Supabase SQL Editor
-- =============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SECTION 1 — TABLE DEFINITIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A. PROFILES
-- Extends auth.users with display data and accessibility preferences.
-- Role is managed server-side only — never set by the user directly.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                       UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                TEXT        NOT NULL,
  preferred_name           TEXT,
  preferred_language       TEXT        NOT NULL DEFAULT 'en',
  role                     TEXT        NOT NULL DEFAULT 'user'
                                       CHECK (role IN ('user', 'admin', 'staff')),
  text_size_preference     TEXT        NOT NULL DEFAULT 'medium'
                                       CHECK (text_size_preference IN ('small', 'medium', 'large', 'xlarge')),
  reduced_motion           BOOLEAN     NOT NULL DEFAULT false,
  preferred_communication  TEXT        NOT NULL DEFAULT 'any'
                                       CHECK (preferred_communication IN ('written', 'spoken', 'any')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Extended user profile. Role field is server-managed only.';

-- ---------------------------------------------------------------------------
-- B. ACCESSIBILITY PREFERENCES
-- Key-value store for individual user accessibility needs.
-- Users only ever see and manage their own rows (enforced by RLS).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accessibility_preferences (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preference_key    TEXT        NOT NULL
                                CHECK (preference_key IN (
                                  'written_communication',
                                  'additional_time',
                                  'quiet_environment',
                                  'step_by_step_instructions',
                                  'clear_simple_language',
                                  'navigation_assistance',
                                  'speech_not_preferred',
                                  'large_print',
                                  'screen_reader',
                                  'wheelchair_access',
                                  'other'
                                )),
  preference_value  TEXT        NOT NULL DEFAULT 'true',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, preference_key)
);

COMMENT ON TABLE public.accessibility_preferences IS
  'Per-user accessibility preference flags. Each (user_id, preference_key) pair is unique.';

-- ---------------------------------------------------------------------------
-- C. SERVICES
-- College service providers available for booking.
-- Only admins may create/update/delete. Authenticated users read active ones.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id                       UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                     TEXT        NOT NULL,
  slug                     TEXT        NOT NULL UNIQUE,
  category                 TEXT        NOT NULL
                                       CHECK (category IN (
                                         'academic_administration',
                                         'examination_services',
                                         'student_support',
                                         'counselling_services',
                                         'financial_assistance',
                                         'disability_support',
                                         'general_enquiries'
                                       )),
  description              TEXT,
  department               TEXT,
  location                 TEXT,
  contact_information      TEXT,
  operating_hours          JSONB,
  accessibility_information TEXT,
  booking_instructions     TEXT,
  is_active                BOOLEAN     NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.services IS 'College services available for appointment booking.';

-- ---------------------------------------------------------------------------
-- D. APPOINTMENT SLOTS
-- Specific time windows within a service that users may book.
-- Capacity + booked_count enforce database-level overbooking prevention.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id    UUID        NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  capacity      INTEGER     NOT NULL DEFAULT 1 CHECK (capacity > 0),
  booked_count  INTEGER     NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
  status        TEXT        NOT NULL DEFAULT 'available'
                            CHECK (status IN ('available', 'full', 'cancelled', 'blocked')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT slot_time_order        CHECK (ends_at > starts_at),
  CONSTRAINT booked_within_capacity CHECK (booked_count <= capacity)
);

COMMENT ON TABLE public.appointment_slots IS
  'Bookable time slots for services. booked_count is atomically updated inside book_appointment().';

-- ---------------------------------------------------------------------------
-- E. APPOINTMENTS
-- A user's booking record linking them to a slot.
-- Status lifecycle: requested → confirmed | rejected | cancelled | completed
-- Transactional booking is handled by book_appointment() below.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id                         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id                 UUID        NOT NULL REFERENCES public.services(id),
  slot_id                    UUID        NOT NULL REFERENCES public.appointment_slots(id),
  status                     TEXT        NOT NULL DEFAULT 'requested'
                                         CHECK (status IN (
                                           'requested',
                                           'confirmed',
                                           'rejected',
                                           'cancelled',
                                           'completed'
                                         )),
  accessibility_requirements JSONB       NOT NULL DEFAULT '[]',
  additional_instructions    TEXT,
  cancellation_reason        TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent the same user booking the same slot twice (unless prior was cancelled/rejected)
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_active
  ON public.appointments (user_id, slot_id)
  WHERE status NOT IN ('cancelled', 'rejected');

COMMENT ON TABLE public.appointments IS
  'User appointment records. Booking is performed atomically via book_appointment().';

-- ---------------------------------------------------------------------------
-- F. VISIT GUIDES
-- AI-generated visit preparation guides linked to an appointment.
-- Stores both the original source text and all structured AI outputs.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visit_guides (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id       UUID        REFERENCES public.appointments(id) ON DELETE SET NULL,
  title                TEXT,
  source_text          TEXT        NOT NULL,
  simplified_summary   TEXT,
  preparation_checklist JSONB      NOT NULL DEFAULT '[]',
  important_information JSONB      NOT NULL DEFAULT '[]',
  steps                JSONB       NOT NULL DEFAULT '[]',
  things_to_bring      JSONB       NOT NULL DEFAULT '[]',
  questions_to_ask     JSONB       NOT NULL DEFAULT '[]',
  warnings             JSONB       NOT NULL DEFAULT '[]',
  output_language      TEXT        NOT NULL DEFAULT 'en',
  ai_provider          TEXT        NOT NULL DEFAULT 'gemini',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.visit_guides IS
  'AI-generated visit guides. source_text is user-provided; all other structured fields are AI output validated by Zod.';

-- ---------------------------------------------------------------------------
-- G. COMMUNICATION MESSAGES
-- Predefined and custom user communication messages for My Voice feature.
-- is_predefined=true rows are system-seeded and readable by all authenticated users.
-- user_id is NULL for predefined messages.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communication_messages (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  category         TEXT        NOT NULL DEFAULT 'custom'
                               CHECK (category IN (
                                 'assistance',
                                 'written_instructions',
                                 'additional_time',
                                 'communication_preferences',
                                 'repeat_information',
                                 'quiet_environment',
                                 'directions',
                                 'simple_language',
                                 'appointment_requirement',
                                 'clarification',
                                 'custom'
                               )),
  original_text    TEXT        NOT NULL,
  translated_text  TEXT,
  source_language  TEXT        NOT NULL DEFAULT 'en',
  target_language  TEXT,
  is_predefined    BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.communication_messages IS
  'My Voice messages. is_predefined=true rows are system messages with user_id=NULL.';

-- ---------------------------------------------------------------------------
-- H. SERVICE FEEDBACK
-- Optional post-visit feedback from users for a service.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_feedback (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id      UUID        NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  appointment_id  UUID        REFERENCES public.appointments(id) ON DELETE SET NULL,
  rating          INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.service_feedback IS 'Post-visit service feedback. Ratings 1–5.';

-- ---------------------------------------------------------------------------
-- I. AUDIT EVENTS
-- Administrative audit trail. Does NOT store sensitive user communication content.
-- Only the service-role backend writes here; admins can read.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action         TEXT        NOT NULL,
  resource_type  TEXT        NOT NULL,
  resource_id    UUID,
  metadata       JSONB       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_events IS
  'Administrative audit trail. Does not contain sensitive communication content.';


-- =============================================================================
-- SECTION 2 — INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);

CREATE INDEX IF NOT EXISTS idx_accessibility_prefs_user_id
  ON public.accessibility_preferences (user_id);

CREATE INDEX IF NOT EXISTS idx_services_category
  ON public.services (category);

CREATE INDEX IF NOT EXISTS idx_services_is_active
  ON public.services (is_active);

CREATE INDEX IF NOT EXISTS idx_services_slug
  ON public.services (slug);

CREATE INDEX IF NOT EXISTS idx_slots_service_id
  ON public.appointment_slots (service_id);

CREATE INDEX IF NOT EXISTS idx_slots_starts_at
  ON public.appointment_slots (starts_at);

CREATE INDEX IF NOT EXISTS idx_slots_status
  ON public.appointment_slots (status);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id
  ON public.appointments (user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_service_id
  ON public.appointments (service_id);

CREATE INDEX IF NOT EXISTS idx_appointments_slot_id
  ON public.appointments (slot_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON public.appointments (status);

CREATE INDEX IF NOT EXISTS idx_visit_guides_user_id
  ON public.visit_guides (user_id);

CREATE INDEX IF NOT EXISTS idx_visit_guides_appointment_id
  ON public.visit_guides (appointment_id);

CREATE INDEX IF NOT EXISTS idx_comm_messages_user_id
  ON public.communication_messages (user_id);

CREATE INDEX IF NOT EXISTS idx_comm_messages_category
  ON public.communication_messages (category);

CREATE INDEX IF NOT EXISTS idx_comm_messages_predefined
  ON public.communication_messages (is_predefined);

CREATE INDEX IF NOT EXISTS idx_feedback_service_id
  ON public.service_feedback (service_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id
  ON public.audit_events (actor_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_resource_type
  ON public.audit_events (resource_type);


-- =============================================================================
-- SECTION 3 — TRIGGER FUNCTIONS
-- =============================================================================

-- Auto-update updated_at on any UPDATE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER accessibility_preferences_updated_at
  BEFORE UPDATE ON public.accessibility_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER visit_guides_updated_at
  BEFORE UPDATE ON public.visit_guides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create a profile row whenever a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'en')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- SECTION 4 — TRANSACTIONAL BOOKING FUNCTION
-- Atomically creates an appointment and increments the slot's booked_count.
-- Uses FOR UPDATE to prevent race conditions / overbooking.
-- Called from the Express backend using the service-role client.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.book_appointment(
  p_user_id                  UUID,
  p_service_id               UUID,
  p_slot_id                  UUID,
  p_accessibility_requirements JSONB,
  p_additional_instructions  TEXT
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_slot        public.appointment_slots;
  v_appointment public.appointments;
BEGIN
  -- Lock the target slot for the duration of this transaction
  SELECT * INTO v_slot
  FROM   public.appointment_slots
  WHERE  id         = p_slot_id
    AND  service_id = p_service_id
    AND  status     = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SLOT_NOT_FOUND: The requested appointment slot is not available.';
  END IF;

  -- Capacity check
  IF v_slot.booked_count >= v_slot.capacity THEN
    RAISE EXCEPTION 'SLOT_FULL: This appointment slot is fully booked.';
  END IF;

  -- Duplicate active booking check
  IF EXISTS (
    SELECT 1
    FROM   public.appointments
    WHERE  user_id  = p_user_id
      AND  slot_id  = p_slot_id
      AND  status  NOT IN ('cancelled', 'rejected')
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_BOOKING: You already have a booking for this slot.';
  END IF;

  -- Create the appointment record
  INSERT INTO public.appointments (
    user_id, service_id, slot_id,
    status, accessibility_requirements, additional_instructions
  )
  VALUES (
    p_user_id, p_service_id, p_slot_id,
    'requested', p_accessibility_requirements, p_additional_instructions
  )
  RETURNING * INTO v_appointment;

  -- Atomically increment booked_count; flip status to 'full' if capacity reached
  UPDATE public.appointment_slots
  SET
    booked_count = booked_count + 1,
    status = CASE
               WHEN booked_count + 1 >= capacity THEN 'full'
               ELSE status
             END
  WHERE id = p_slot_id;

  RETURN v_appointment;
END;
$$;

-- Grant execute to the authenticated role (backend calls this via service-role)
GRANT EXECUTE ON FUNCTION public.book_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment TO service_role;


-- =============================================================================
-- SECTION 5 — ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on every user-owned table
ALTER TABLE public.profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_guides             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_feedback         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events             ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_own    ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own    ON public.profiles;
DROP POLICY IF EXISTS profiles_select_admin  ON public.profiles;

-- Users read their own profile
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users update their own profile but CANNOT escalate their own role
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Admins and staff read any profile
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ---------------------------------------------------------------------------
-- ACCESSIBILITY PREFERENCES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS ap_select_own ON public.accessibility_preferences;
DROP POLICY IF EXISTS ap_insert_own ON public.accessibility_preferences;
DROP POLICY IF EXISTS ap_update_own ON public.accessibility_preferences;
DROP POLICY IF EXISTS ap_delete_own ON public.accessibility_preferences;

CREATE POLICY ap_select_own ON public.accessibility_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ap_insert_own ON public.accessibility_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ap_update_own ON public.accessibility_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY ap_delete_own ON public.accessibility_preferences FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- SERVICES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS services_select_active ON public.services;
DROP POLICY IF EXISTS services_select_admin  ON public.services;
DROP POLICY IF EXISTS services_insert_admin  ON public.services;
DROP POLICY IF EXISTS services_update_admin  ON public.services;
DROP POLICY IF EXISTS services_delete_admin  ON public.services;

CREATE POLICY services_select_active ON public.services
  FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY services_select_admin ON public.services
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY services_insert_admin ON public.services
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY services_update_admin ON public.services
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY services_delete_admin ON public.services
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- APPOINTMENT SLOTS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS slots_select_authenticated ON public.appointment_slots;
DROP POLICY IF EXISTS slots_insert_admin         ON public.appointment_slots;
DROP POLICY IF EXISTS slots_update_admin         ON public.appointment_slots;
DROP POLICY IF EXISTS slots_delete_admin         ON public.appointment_slots;

CREATE POLICY slots_select_authenticated ON public.appointment_slots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY slots_insert_admin ON public.appointment_slots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY slots_update_admin ON public.appointment_slots
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY slots_delete_admin ON public.appointment_slots
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- APPOINTMENTS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS appointments_select_own   ON public.appointments;
DROP POLICY IF EXISTS appointments_insert_own   ON public.appointments;
DROP POLICY IF EXISTS appointments_update_own   ON public.appointments;
DROP POLICY IF EXISTS appointments_select_admin ON public.appointments;
DROP POLICY IF EXISTS appointments_update_admin ON public.appointments;

CREATE POLICY appointments_select_own ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY appointments_insert_own ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users may only cancel their own requested appointments
CREATE POLICY appointments_update_own ON public.appointments
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'requested')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

CREATE POLICY appointments_select_admin ON public.appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY appointments_update_admin ON public.appointments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- ---------------------------------------------------------------------------
-- VISIT GUIDES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS vg_select_own ON public.visit_guides;
DROP POLICY IF EXISTS vg_insert_own ON public.visit_guides;
DROP POLICY IF EXISTS vg_update_own ON public.visit_guides;
DROP POLICY IF EXISTS vg_delete_own ON public.visit_guides;

CREATE POLICY vg_select_own ON public.visit_guides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY vg_insert_own ON public.visit_guides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY vg_update_own ON public.visit_guides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY vg_delete_own ON public.visit_guides FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- COMMUNICATION MESSAGES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS cm_select_own_or_predefined ON public.communication_messages;
DROP POLICY IF EXISTS cm_insert_own               ON public.communication_messages;
DROP POLICY IF EXISTS cm_delete_own               ON public.communication_messages;

-- Users see their own messages AND all predefined ones (user_id IS NULL)
CREATE POLICY cm_select_own_or_predefined ON public.communication_messages
  FOR SELECT
  USING (auth.uid() = user_id OR is_predefined = true);

CREATE POLICY cm_insert_own ON public.communication_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own custom (non-predefined) messages
CREATE POLICY cm_delete_own ON public.communication_messages
  FOR DELETE USING (auth.uid() = user_id AND is_predefined = false);

-- ---------------------------------------------------------------------------
-- SERVICE FEEDBACK
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS feedback_select_own   ON public.service_feedback;
DROP POLICY IF EXISTS feedback_insert_own   ON public.service_feedback;
DROP POLICY IF EXISTS feedback_select_admin ON public.service_feedback;

CREATE POLICY feedback_select_own ON public.service_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY feedback_insert_own ON public.service_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY feedback_select_admin ON public.service_feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- ---------------------------------------------------------------------------
-- AUDIT EVENTS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_select_admin ON public.audit_events;
DROP POLICY IF EXISTS audit_insert_any   ON public.audit_events;

CREATE POLICY audit_select_admin ON public.audit_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Backend service-role inserts audit events
CREATE POLICY audit_insert_any ON public.audit_events
  FOR INSERT WITH CHECK (true);


-- =============================================================================
-- SECTION 6 — SEED DATA
-- All rows are clearly labelled as demonstration/development data.
-- Safe to re-run (uses ON CONFLICT DO NOTHING).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- College Services (7 demo services)
-- ---------------------------------------------------------------------------
INSERT INTO public.services (
  id, name, slug, category, description, department,
  location, contact_information, operating_hours,
  accessibility_information, booking_instructions, is_active
)
VALUES
  (
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Academic Administration Office',
    'academic-admin',
    'academic_administration',
    'Handles enrolment, course registration, academic records and general administration requests. [DEMO SERVICE]',
    'Academic Affairs',
    'Main Building, Room 101',
    'academic@college.edu | 01-234-5678',
    '{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-15:00"}',
    'Wheelchair accessible entrance. Written communication supported. Additional time slots available.',
    'Please bring your student ID. Indicate accessibility requirements when booking.',
    true
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000002',
    'Examination Services',
    'examination-services',
    'examination_services',
    'Manages exam registration, alternative arrangements, results queries and appeals. [DEMO SERVICE]',
    'Examinations Department',
    'Block B, Ground Floor',
    'exams@college.edu | 01-234-5679',
    '{"monday":"09:00-16:00","tuesday":"09:00-16:00","wednesday":"09:00-16:00","thursday":"09:00-16:00","friday":"09:00-13:00"}',
    'Quiet waiting area. Alternative examination formats available. Step-free access throughout.',
    'Have your examination number ready. Alternative arrangements must be requested at least 2 weeks before exams.',
    true
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000003',
    'Student Support Centre',
    'student-support',
    'student_support',
    'Support for students facing academic, personal or wellbeing challenges. Confidential. [DEMO SERVICE]',
    'Student Services',
    'Student Hub, Level 2',
    'support@college.edu | 01-234-5680',
    '{"monday":"08:30-18:00","tuesday":"08:30-18:00","wednesday":"08:30-18:00","thursday":"08:30-18:00","friday":"08:30-17:00","saturday":"10:00-14:00"}',
    'Drop-in and appointment options. Quiet room accessible. Staff trained in accessible communication.',
    'All appointments are confidential. Briefly describe what you need support with when booking.',
    true
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000004',
    'Disability Support Office',
    'disability-support',
    'disability_support',
    'Coordinates reasonable adjustments, support plans and specialist support. [DEMO SERVICE]',
    'Disability Services',
    'Building C, Room 205',
    'disability@college.edu | 01-234-5681',
    '{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-16:00"}',
    'Fully accessible building. BSL interpreter available on request. Extended appointment times available.',
    'You do not need to disclose a specific diagnosis. We will work with you based on the support you need.',
    true
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000005',
    'Financial Assistance Office',
    'financial-assistance',
    'financial_assistance',
    'Advises on scholarships, bursaries, emergency funds and financial support. [DEMO SERVICE]',
    'Student Finance',
    'Administration Block, Room 15',
    'finance@college.edu | 01-234-5682',
    '{"monday":"10:00-16:00","tuesday":"10:00-16:00","wednesday":"10:00-16:00","thursday":"10:00-16:00","friday":"10:00-14:00"}',
    'Private consultation rooms available. Written summaries provided on request.',
    'Bring evidence of student enrolment and any relevant financial documentation.',
    true
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000006',
    'Counselling Services',
    'counselling',
    'counselling_services',
    'Short-term counselling and mental health support in a safe, confidential setting. [DEMO SERVICE]',
    'Wellbeing Services',
    'Wellbeing Centre, Ground Floor',
    'counselling@college.edu | 01-234-5683',
    '{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00"}',
    'Completely private and confidential. Calm environment. Text-based communication options available.',
    'All information shared is strictly confidential. Mention specific communication needs when booking.',
    true
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000007',
    'Academic Advising',
    'academic-advising',
    'academic_administration',
    'Course selection, academic planning, progression queries and degree requirement guidance. [DEMO SERVICE]',
    'Academic Affairs',
    'Main Building, Room 110',
    'advising@college.edu | 01-234-5684',
    '{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-15:00"}',
    'Written appointment summaries provided on request. Extended time slots available.',
    'Review your current course plan before attending. Bring any relevant correspondence.',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Appointment Slots (future-dated, recalculated relative to NOW())
-- These are demonstration slots. Real slots should be created via the admin UI.
-- ---------------------------------------------------------------------------
INSERT INTO public.appointment_slots (id, service_id, starts_at, ends_at, capacity, status)
VALUES
  -- Academic Admin
  ('bbbbbbbb-0001-0001-0001-000000000001','aaaaaaaa-0001-0001-0001-000000000001', NOW() + INTERVAL '1 day 9 hours',  NOW() + INTERVAL '1 day 9 hours 30 minutes',  1,'available'),
  ('bbbbbbbb-0001-0001-0001-000000000002','aaaaaaaa-0001-0001-0001-000000000001', NOW() + INTERVAL '1 day 10 hours', NOW() + INTERVAL '1 day 10 hours 30 minutes', 1,'available'),
  ('bbbbbbbb-0001-0001-0001-000000000003','aaaaaaaa-0001-0001-0001-000000000001', NOW() + INTERVAL '1 day 14 hours', NOW() + INTERVAL '1 day 14 hours 30 minutes', 1,'available'),
  ('bbbbbbbb-0001-0001-0001-000000000004','aaaaaaaa-0001-0001-0001-000000000001', NOW() + INTERVAL '2 days 9 hours',  NOW() + INTERVAL '2 days 9 hours 30 minutes',  1,'available'),
  ('bbbbbbbb-0001-0001-0001-000000000005','aaaaaaaa-0001-0001-0001-000000000001', NOW() + INTERVAL '3 days 11 hours', NOW() + INTERVAL '3 days 11 hours 30 minutes', 1,'available'),
  -- Examination Services
  ('bbbbbbbb-0002-0001-0001-000000000001','aaaaaaaa-0001-0001-0001-000000000002', NOW() + INTERVAL '1 day 9 hours',  NOW() + INTERVAL '1 day 9 hours 45 minutes',  1,'available'),
  ('bbbbbbbb-0002-0001-0001-000000000002','aaaaaaaa-0001-0001-0001-000000000002', NOW() + INTERVAL '2 days 13 hours', NOW() + INTERVAL '2 days 13 hours 45 minutes', 1,'available'),
  ('bbbbbbbb-0002-0001-0001-000000000003','aaaaaaaa-0001-0001-0001-000000000002', NOW() + INTERVAL '4 days 10 hours', NOW() + INTERVAL '4 days 10 hours 45 minutes', 1,'available'),
  -- Student Support (capacity 2)
  ('bbbbbbbb-0003-0001-0001-000000000001','aaaaaaaa-0001-0001-0001-000000000003', NOW() + INTERVAL '1 day 9 hours',  NOW() + INTERVAL '1 day 9 hours 30 minutes',  2,'available'),
  ('bbbbbbbb-0003-0001-0001-000000000002','aaaaaaaa-0001-0001-0001-000000000003', NOW() + INTERVAL '1 day 11 hours', NOW() + INTERVAL '1 day 11 hours 30 minutes', 2,'available'),
  ('bbbbbbbb-0003-0001-0001-000000000003','aaaaaaaa-0001-0001-0001-000000000003', NOW() + INTERVAL '2 days 14 hours', NOW() + INTERVAL '2 days 14 hours 30 minutes', 2,'available'),
  -- Disability Support (60-min slots)
  ('bbbbbbbb-0004-0001-0001-000000000001','aaaaaaaa-0001-0001-0001-000000000004', NOW() + INTERVAL '1 day 10 hours',  NOW() + INTERVAL '1 day 11 hours',  1,'available'),
  ('bbbbbbbb-0004-0001-0001-000000000002','aaaaaaaa-0001-0001-0001-000000000004', NOW() + INTERVAL '3 days 10 hours',  NOW() + INTERVAL '3 days 11 hours',  1,'available'),
  ('bbbbbbbb-0004-0001-0001-000000000003','aaaaaaaa-0001-0001-0001-000000000004', NOW() + INTERVAL '5 days 14 hours',  NOW() + INTERVAL '5 days 15 hours',  1,'available'),
  -- Financial Assistance
  ('bbbbbbbb-0005-0001-0001-000000000001','aaaaaaaa-0001-0001-0001-000000000005', NOW() + INTERVAL '2 days 10 hours', NOW() + INTERVAL '2 days 10 hours 30 minutes', 1,'available'),
  ('bbbbbbbb-0005-0001-0001-000000000002','aaaaaaaa-0001-0001-0001-000000000005', NOW() + INTERVAL '4 days 14 hours', NOW() + INTERVAL '4 days 14 hours 30 minutes', 1,'available'),
  -- Counselling
  ('bbbbbbbb-0006-0001-0001-000000000001','aaaaaaaa-0001-0001-0001-000000000006', NOW() + INTERVAL '1 day 9 hours',  NOW() + INTERVAL '1 day 10 hours',  1,'available'),
  ('bbbbbbbb-0006-0001-0001-000000000002','aaaaaaaa-0001-0001-0001-000000000006', NOW() + INTERVAL '2 days 14 hours', NOW() + INTERVAL '2 days 15 hours',  1,'available'),
  ('bbbbbbbb-0006-0001-0001-000000000003','aaaaaaaa-0001-0001-0001-000000000006', NOW() + INTERVAL '3 days 16 hours', NOW() + INTERVAL '3 days 17 hours',  1,'available'),
  -- Academic Advising
  ('bbbbbbbb-0007-0001-0001-000000000001','aaaaaaaa-0001-0001-0001-000000000007', NOW() + INTERVAL '1 day 10 hours', NOW() + INTERVAL '1 day 10 hours 30 minutes', 1,'available'),
  ('bbbbbbbb-0007-0001-0001-000000000002','aaaaaaaa-0001-0001-0001-000000000007', NOW() + INTERVAL '3 days 13 hours', NOW() + INTERVAL '3 days 13 hours 30 minutes', 1,'available')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Predefined Communication Messages (My Voice — system messages)
-- user_id = NULL; is_predefined = true; readable by all authenticated users.
-- ---------------------------------------------------------------------------
INSERT INTO public.communication_messages (
  id, user_id, category, original_text, source_language, is_predefined
)
VALUES
  ('cccccccc-0001-0001-0001-000000000001', NULL, 'assistance',
   'I need some assistance, please. Could someone help me?',
   'en', true),

  ('cccccccc-0001-0001-0001-000000000002', NULL, 'written_instructions',
   'Could you please give me the instructions in writing? I find it easier to follow written information.',
   'en', true),

  ('cccccccc-0001-0001-0001-000000000003', NULL, 'additional_time',
   'I may need a little extra time. Please do not rush me — I am doing my best.',
   'en', true),

  ('cccccccc-0001-0001-0001-000000000004', NULL, 'communication_preferences',
   'I prefer written or visual communication. Please write things down for me if possible.',
   'en', true),

  ('cccccccc-0001-0001-0001-000000000005', NULL, 'repeat_information',
   'Could you please repeat that? I would like to make sure I have understood correctly.',
   'en', true),

  ('cccccccc-0001-0001-0001-000000000006', NULL, 'quiet_environment',
   'I find it easier to concentrate in a quieter environment. Is there somewhere quieter we could speak?',
   'en', true),

  ('cccccccc-0001-0001-0001-000000000007', NULL, 'directions',
   'Could you help me find the right place? I am looking for directions.',
   'en', true),

  ('cccccccc-0001-0001-0001-000000000008', NULL, 'simple_language',
   'Could you use simpler language, please? Short sentences are easier for me to understand.',
   'en', true),

  ('cccccccc-0001-0001-0001-000000000009', NULL, 'appointment_requirement',
   'I have an appointment. I have accessibility requirements that were noted when I booked. Could you check the notes please?',
   'en', true),

  ('cccccccc-0001-0001-0001-000000000010', NULL, 'clarification',
   'I am not sure I understood that. Could you clarify, please?',
   'en', true)

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- END OF MIGRATION 001_initial_schema.sql
-- =============================================================================
