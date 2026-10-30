-- AHEAD Platform — Row Level Security Policies
-- Migration: 002_rls_policies

-- Enable RLS on all user-owned tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- ACCESSIBILITY PREFERENCES
-- ============================================================
CREATE POLICY "accessibility_preferences_select_own" ON public.accessibility_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "accessibility_preferences_insert_own" ON public.accessibility_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accessibility_preferences_update_own" ON public.accessibility_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "accessibility_preferences_delete_own" ON public.accessibility_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- SERVICES
-- ============================================================
-- Anyone authenticated can read active services
CREATE POLICY "services_select_active" ON public.services
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Admins can read all services
CREATE POLICY "services_select_admin" ON public.services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Only admins can insert/update/delete services
CREATE POLICY "services_insert_admin" ON public.services
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "services_update_admin" ON public.services
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "services_delete_admin" ON public.services
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- APPOINTMENT SLOTS
-- ============================================================
-- Authenticated users can view available slots
CREATE POLICY "slots_select_authenticated" ON public.appointment_slots
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage slots
CREATE POLICY "slots_insert_admin" ON public.appointment_slots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "slots_update_admin" ON public.appointment_slots
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "slots_delete_admin" ON public.appointment_slots
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE POLICY "appointments_select_own" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "appointments_insert_own" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments_update_own" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('requested'));

-- Admins can see and update all appointments
CREATE POLICY "appointments_select_admin" ON public.appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "appointments_update_admin" ON public.appointments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- ============================================================
-- VISIT GUIDES
-- ============================================================
CREATE POLICY "visit_guides_select_own" ON public.visit_guides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "visit_guides_insert_own" ON public.visit_guides
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visit_guides_update_own" ON public.visit_guides
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "visit_guides_delete_own" ON public.visit_guides
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- COMMUNICATION MESSAGES
-- ============================================================
CREATE POLICY "messages_select_own" ON public.communication_messages
  FOR SELECT USING (auth.uid() = user_id OR is_predefined = true);

CREATE POLICY "messages_insert_own" ON public.communication_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "messages_delete_own" ON public.communication_messages
  FOR DELETE USING (auth.uid() = user_id AND is_predefined = false);

-- ============================================================
-- SERVICE FEEDBACK
-- ============================================================
CREATE POLICY "feedback_select_own" ON public.service_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "feedback_insert_own" ON public.service_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feedback_select_admin" ON public.service_feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- ============================================================
-- AUDIT EVENTS (admin-only read)
-- ============================================================
CREATE POLICY "audit_events_select_admin" ON public.audit_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role can insert audit events
CREATE POLICY "audit_events_insert_service" ON public.audit_events
  FOR INSERT WITH CHECK (true);
