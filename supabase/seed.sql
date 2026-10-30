-- AHEAD Platform — Development Seed Data
-- WARNING: This file contains sample data for development/demonstration only.
-- All records are clearly marked as demonstration data.
-- DO NOT use in production without modification.

-- ============================================================
-- DEMO SERVICES (College Services)
-- ============================================================
INSERT INTO public.services (id, name, slug, category, description, department, location, contact_information, operating_hours, accessibility_information, booking_instructions, is_active)
VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'Academic Administration Office',
    'academic-admin',
    'academic_administration',
    'Handles enrollment, course registration, academic records and general academic administration requests.',
    'Academic Affairs',
    'Main Building, Room 101',
    'academic@college.edu | 01-234-5678',
    '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-15:00"}',
    'Wheelchair accessible entrance available. Written communication supported. Appointment slots can include additional time.',
    'Please bring your student ID. If you require additional time or specific accommodations, please indicate these in your booking.',
    true
  ),
  (
    'a1b2c3d4-0001-0001-0001-000000000002',
    'Examination Services',
    'examination-services',
    'examination_services',
    'Manages examination registration, alternative examination arrangements, results queries and examination-related appeals.',
    'Examinations Department',
    'Block B, Ground Floor',
    'exams@college.edu | 01-234-5679',
    '{"monday": "09:00-16:00", "tuesday": "09:00-16:00", "wednesday": "09:00-16:00", "thursday": "09:00-16:00", "friday": "09:00-13:00"}',
    'Quiet waiting area available. Alternative examination formats can be arranged. Step-free access throughout.',
    'Please have your examination number ready. Alternative arrangement requests should be submitted at least 2 weeks before exams.',
    true
  ),
  (
    'a1b2c3d4-0001-0001-0001-000000000003',
    'Student Support Centre',
    'student-support',
    'student_support',
    'Provides support for students experiencing academic, personal or wellbeing challenges. A welcoming, confidential space.',
    'Student Services',
    'Student Hub, Level 2',
    'support@college.edu | 01-234-5680',
    '{"monday": "08:30-18:00", "tuesday": "08:30-18:00", "wednesday": "08:30-18:00", "thursday": "08:30-18:00", "friday": "08:30-17:00", "saturday": "10:00-14:00"}',
    'Drop-in and appointment options available. Quiet room accessible. Staff trained in accessible communication.',
    'All appointments are confidential. Please describe briefly what you need support with so we can prepare appropriately.',
    true
  ),
  (
    'a1b2c3d4-0001-0001-0001-000000000004',
    'Disability Support Office',
    'disability-support',
    'disability_support',
    'Coordinates reasonable adjustments, support plans and specialist support for students with disabilities.',
    'Disability Services',
    'Building C, Room 205',
    'disability@college.edu | 01-234-5681',
    '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-16:00"}',
    'Fully accessible building. British Sign Language interpreter available on request. Extended appointment times available.',
    'Please note that you do not need to disclose a specific diagnosis. We will work with you based on the support you need.',
    true
  ),
  (
    'a1b2c3d4-0001-0001-0001-000000000005',
    'Financial Assistance Office',
    'financial-assistance',
    'financial_assistance',
    'Advises on scholarships, bursaries, emergency funds and other financial support available to students.',
    'Student Finance',
    'Administration Block, Room 15',
    'finance@college.edu | 01-234-5682',
    '{"monday": "10:00-16:00", "tuesday": "10:00-16:00", "wednesday": "10:00-16:00", "thursday": "10:00-16:00", "friday": "10:00-14:00"}',
    'Private consultation rooms available. Written summaries of advice provided on request.',
    'Please bring evidence of your student enrolment and any relevant financial documentation if available.',
    true
  ),
  (
    'a1b2c3d4-0001-0001-0001-000000000006',
    'Counselling Services',
    'counselling',
    'counselling_services',
    'Provides short-term counselling and mental health support for students in a safe, confidential setting.',
    'Wellbeing Services',
    'Wellbeing Centre, Ground Floor',
    'counselling@college.edu | 01-234-5683',
    '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00"}',
    'Completely private and confidential. Calm and welcoming environment. Text-based communication options available.',
    'All information shared is strictly confidential. If you have specific communication needs, please mention these when booking.',
    true
  ),
  (
    'a1b2c3d4-0001-0001-0001-000000000007',
    'Academic Advising',
    'academic-advising',
    'academic_administration',
    'Helps students with course selection, academic planning, progression queries and degree requirement guidance.',
    'Academic Affairs',
    'Main Building, Room 110',
    'advising@college.edu | 01-234-5684',
    '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-15:00"}',
    'Written appointment summaries provided on request. Extended time slots available.',
    'Please review your current course plan before your appointment if possible. Bring any relevant correspondence.',
    true
  );

-- ============================================================
-- DEMO APPOINTMENT SLOTS (next 2 weeks)
-- ============================================================
-- Academic Admin slots
INSERT INTO public.appointment_slots (id, service_id, starts_at, ends_at, capacity, status)
VALUES
  ('b1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '9 hours 30 minutes', 1, 'available'),
  ('b1b2c3d4-0001-0001-0001-000000000002', 'a1b2c3d4-0001-0001-0001-000000000001', NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '10 hours 30 minutes', 1, 'available'),
  ('b1b2c3d4-0001-0001-0001-000000000003', 'a1b2c3d4-0001-0001-0001-000000000001', NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '14 hours 30 minutes', 1, 'available'),
  ('b1b2c3d4-0001-0001-0001-000000000004', 'a1b2c3d4-0001-0001-0001-000000000001', NOW() + INTERVAL '2 days' + INTERVAL '9 hours', NOW() + INTERVAL '2 days' + INTERVAL '9 hours 30 minutes', 1, 'available'),
  ('b1b2c3d4-0001-0001-0001-000000000005', 'a1b2c3d4-0001-0001-0001-000000000001', NOW() + INTERVAL '3 days' + INTERVAL '11 hours', NOW() + INTERVAL '3 days' + INTERVAL '11 hours 30 minutes', 1, 'available');

-- Exam Services slots
INSERT INTO public.appointment_slots (id, service_id, starts_at, ends_at, capacity, status)
VALUES
  ('b1b2c3d4-0002-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000002', NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '9 hours 45 minutes', 1, 'available'),
  ('b1b2c3d4-0002-0001-0001-000000000002', 'a1b2c3d4-0001-0001-0001-000000000002', NOW() + INTERVAL '2 days' + INTERVAL '13 hours', NOW() + INTERVAL '2 days' + INTERVAL '13 hours 45 minutes', 1, 'available'),
  ('b1b2c3d4-0002-0001-0001-000000000003', 'a1b2c3d4-0001-0001-0001-000000000002', NOW() + INTERVAL '4 days' + INTERVAL '10 hours', NOW() + INTERVAL '4 days' + INTERVAL '10 hours 45 minutes', 1, 'available');

-- Student Support slots
INSERT INTO public.appointment_slots (id, service_id, starts_at, ends_at, capacity, status)
VALUES
  ('b1b2c3d4-0003-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000003', NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '9 hours 30 minutes', 2, 'available'),
  ('b1b2c3d4-0003-0001-0001-000000000002', 'a1b2c3d4-0001-0001-0001-000000000003', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours 30 minutes', 2, 'available'),
  ('b1b2c3d4-0003-0001-0001-000000000003', 'a1b2c3d4-0001-0001-0001-000000000003', NOW() + INTERVAL '2 days' + INTERVAL '14 hours', NOW() + INTERVAL '2 days' + INTERVAL '14 hours 30 minutes', 2, 'available');

-- Disability Support slots
INSERT INTO public.appointment_slots (id, service_id, starts_at, ends_at, capacity, status)
VALUES
  ('b1b2c3d4-0004-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000004', NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 1, 'available'),
  ('b1b2c3d4-0004-0001-0001-000000000002', 'a1b2c3d4-0001-0001-0001-000000000004', NOW() + INTERVAL '3 days' + INTERVAL '10 hours', NOW() + INTERVAL '3 days' + INTERVAL '11 hours', 1, 'available'),
  ('b1b2c3d4-0004-0001-0001-000000000003', 'a1b2c3d4-0001-0001-0001-000000000004', NOW() + INTERVAL '5 days' + INTERVAL '14 hours', NOW() + INTERVAL '5 days' + INTERVAL '15 hours', 1, 'available');

-- Financial Assistance slots
INSERT INTO public.appointment_slots (id, service_id, starts_at, ends_at, capacity, status)
VALUES
  ('b1b2c3d4-0005-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000005', NOW() + INTERVAL '2 days' + INTERVAL '10 hours', NOW() + INTERVAL '2 days' + INTERVAL '10 hours 30 minutes', 1, 'available'),
  ('b1b2c3d4-0005-0001-0001-000000000002', 'a1b2c3d4-0001-0001-0001-000000000005', NOW() + INTERVAL '4 days' + INTERVAL '14 hours', NOW() + INTERVAL '4 days' + INTERVAL '14 hours 30 minutes', 1, 'available');

-- ============================================================
-- PREDEFINED COMMUNICATION MESSAGES
-- ============================================================
INSERT INTO public.communication_messages (id, user_id, category, original_text, source_language, is_predefined)
VALUES
  ('c1b2c3d4-0001-0001-0001-000000000001', NULL, 'assistance', 'I need some assistance, please. Could someone help me?', 'en', true),
  ('c1b2c3d4-0001-0001-0001-000000000002', NULL, 'written_instructions', 'Could you please give me the instructions in writing? I find it easier to follow written information.', 'en', true),
  ('c1b2c3d4-0001-0001-0001-000000000003', NULL, 'additional_time', 'I may need a little extra time. Please do not rush me — I am doing my best.', 'en', true),
  ('c1b2c3d4-0001-0001-0001-000000000004', NULL, 'communication_preferences', 'I prefer written or visual communication. Please write things down for me if possible.', 'en', true),
  ('c1b2c3d4-0001-0001-0001-000000000005', NULL, 'repeat_information', 'Could you please repeat that? I would like to make sure I have understood correctly.', 'en', true),
  ('c1b2c3d4-0001-0001-0001-000000000006', NULL, 'quiet_environment', 'I find it easier to concentrate in a quieter environment. Is there somewhere quieter we could speak?', 'en', true),
  ('c1b2c3d4-0001-0001-0001-000000000007', NULL, 'directions', 'Could you help me find the right place? I am looking for directions.', 'en', true),
  ('c1b2c3d4-0001-0001-0001-000000000008', NULL, 'simple_language', 'Could you use simpler language, please? Short sentences are easier for me to understand.', 'en', true),
  ('c1b2c3d4-0001-0001-0001-000000000009', NULL, 'appointment_requirement', 'I have an appointment. I have accessibility requirements that were noted when I booked. Could you check the notes please?', 'en', true),
  ('c1b2c3d4-0001-0001-0001-000000000010', NULL, 'clarification', 'I am not sure I understood that. Could you clarify, please?', 'en', true);
