import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { supabase } from '../config/supabase';
import { geminiService } from '../ai/gemini';
import { generateVisitGuideSchema } from '../validators/schemas';

const router = Router();

// GET /api/v1/visit-guides — list user visit guides
router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('visit_guides')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    sendSuccess(res, data || []);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/visit-guides/:id — single guide
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('visit_guides')
      .select('*, appointment:appointments(*, service:services(*))')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !data) {
      return sendError(res, 'GUIDE_NOT_FOUND', 'Visit guide not found.', 404);
    }

    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/visit-guides/generate — AI simplification and checklist generation
router.post('/generate', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = generateVisitGuideSchema.parse(req.body);

    let appointmentDetails: Record<string, any> | undefined;
    let accessibilityPreferences: string[] = [];

    // If an appointment_id was provided, fetch its context
    if (validated.appointment_id) {
      const { data: appt } = await supabase
        .from('appointments')
        .select('*, service:services(*)')
        .eq('id', validated.appointment_id)
        .eq('user_id', req.user!.id)
        .single();

      if (appt) {
        appointmentDetails = {
          service_name: appt.service?.name,
          location: appt.service?.location,
          contact: appt.service?.contact_information,
          instructions: appt.service?.booking_instructions,
        };
        accessibilityPreferences = Array.isArray(appt.accessibility_requirements)
          ? appt.accessibility_requirements
          : [];
      }
    }

    // Call Gemini to simplify instructions
    const simplifyResult = await geminiService.simplifyAppointmentInstructions(
      validated.source_text,
      appointmentDetails,
      validated.output_language
    );

    if (!simplifyResult.success || !simplifyResult.data) {
      return sendError(
        res,
        'AI_ERROR',
        simplifyResult.error || 'Failed to simplify appointment instructions with Gemini AI.',
        502
      );
    }

    // Call Gemini to generate preparation checklist
    const checklistResult = await geminiService.generateChecklist(
      validated.source_text,
      accessibilityPreferences
    );

    const simplifiedData = simplifyResult.data;
    const checklistData = checklistResult.data;

    // Save into database
    const { data: savedGuide, error } = await supabase
      .from('visit_guides')
      .insert({
        user_id: req.user!.id,
        appointment_id: validated.appointment_id || null,
        title: simplifiedData.title || 'Personalized Visit Guide',
        source_text: validated.source_text,
        simplified_summary: simplifiedData.simple_summary,
        preparation_checklist: checklistData?.checklist || [],
        important_information: simplifiedData.important_details || [],
        steps: simplifiedData.steps || [],
        things_to_bring: simplifiedData.things_to_bring || [],
        questions_to_ask: simplifiedData.questions_to_ask || [],
        warnings: simplifiedData.warnings || [],
        output_language: validated.output_language,
        ai_provider: 'gemini',
      })
      .select()
      .single();

    if (error) {
      console.error('[visit-guides.generate] DB Save error:', error);
      // Return generated data even if saving to DB fails
      return sendSuccess(res, {
        guide: {
          title: simplifiedData.title,
          simplified_summary: simplifiedData.simple_summary,
          preparation_checklist: checklistData?.checklist || [],
          important_information: simplifiedData.important_details || [],
          steps: simplifiedData.steps || [],
          things_to_bring: simplifiedData.things_to_bring || [],
          questions_to_ask: simplifiedData.questions_to_ask || [],
          warnings: simplifiedData.warnings || [],
        },
      }, 'Guide generated successfully (temporary)');
    }

    sendSuccess(res, savedGuide, 'Visit guide generated and saved successfully.', 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/visit-guides/:id
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('visit_guides')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) throw error;
    sendSuccess(res, null, 'Visit guide deleted successfully.');
  } catch (err) {
    next(err);
  }
});

export default router;

