import { z } from 'zod';

// ============================================================
// SHARED
// ============================================================
export const uuidSchema = z.string().uuid('Invalid ID format.');
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================================
// PROFILE
// ============================================================
export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  preferred_name: z.string().max(100).optional(),
  preferred_language: z.string().min(2).max(10).optional(),
  text_size_preference: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
  reduced_motion: z.boolean().optional(),
  preferred_communication: z.enum(['written', 'spoken', 'any']).optional(),
});

// ============================================================
// ACCESSIBILITY PREFERENCES
// ============================================================
export const accessibilityPreferenceKeySchema = z.enum([
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
  'other',
]);

export const updatePreferencesSchema = z.object({
  preferences: z.array(z.object({
    preference_key: accessibilityPreferenceKeySchema,
    preference_value: z.string().max(500).default('true'),
  })).max(20),
});

// ============================================================
// APPOINTMENTS
// ============================================================
export const createAppointmentSchema = z.object({
  service_id: uuidSchema,
  slot_id: uuidSchema,
  accessibility_requirements: z.array(z.string()).max(20).default([]),
  additional_instructions: z.string().max(2000).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['confirmed', 'rejected', 'cancelled', 'completed']),
  cancellation_reason: z.string().max(1000).optional(),
});

// ============================================================
// VISIT GUIDES
// ============================================================
export const generateVisitGuideSchema = z.object({
  source_text: z.string().min(10, 'Please provide appointment instructions to simplify.').max(10000),
  appointment_id: uuidSchema.optional(),
  output_language: z.string().min(2).max(10).default('en'),
  accessibility_context: z.string().max(1000).optional(),
});

// ============================================================
// VOICE / TRANSLATION
// ============================================================
export const translateMessageSchema = z.object({
  text: z.string().min(1).max(5000),
  source_language: z.string().min(2).max(10).default('en'),
  target_language: z.string().min(2).max(10),
});

export const saveMessageSchema = z.object({
  category: z.enum([
    'assistance', 'written_instructions', 'additional_time',
    'communication_preferences', 'repeat_information', 'quiet_environment',
    'directions', 'simple_language', 'appointment_requirement', 'clarification', 'custom'
  ]),
  original_text: z.string().min(1).max(2000),
  translated_text: z.string().max(2000).optional(),
  source_language: z.string().min(2).max(10).default('en'),
  target_language: z.string().min(2).max(10).optional(),
});

// ============================================================
// ADMIN — SERVICES
// ============================================================
export const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only.'),
  category: z.enum([
    'academic_administration', 'examination_services', 'student_support',
    'counselling_services', 'financial_assistance', 'disability_support', 'general_enquiries'
  ]),
  description: z.string().max(2000).optional(),
  department: z.string().max(200).optional(),
  location: z.string().max(300).optional(),
  contact_information: z.string().max(500).optional(),
  operating_hours: z.record(z.string()).optional(),
  accessibility_information: z.string().max(1000).optional(),
  booking_instructions: z.string().max(1000).optional(),
  is_active: z.boolean().default(true),
});

// ============================================================
// ADMIN — SLOTS
// ============================================================
export const createSlotSchema = z.object({
  service_id: uuidSchema,
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  capacity: z.number().int().positive().max(100).default(1),
});

// ============================================================
// AI RESPONSE VALIDATION
// ============================================================
export const simplifiedInstructionsSchema = z.object({
  title: z.string(),
  simple_summary: z.string(),
  important_details: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })),
  steps: z.array(z.object({
    step_number: z.number(),
    instruction: z.string(),
  })),
  things_to_bring: z.array(z.string()),
  questions_to_ask: z.array(z.string()),
  missing_information: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const checklistSchema = z.object({
  checklist: z.array(z.object({
    task: z.string(),
    reason: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    completed: z.boolean().default(false),
  })),
  preparation_summary: z.string(),
  reminders: z.array(z.string()),
});

export const translationResponseSchema = z.object({
  original_text: z.string(),
  translated_text: z.string(),
  source_language: z.string(),
  target_language: z.string(),
  translation_notes: z.array(z.string()),
});
