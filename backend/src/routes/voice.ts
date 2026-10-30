import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { supabase } from '../config/supabase';
import { geminiService } from '../ai/gemini';
import { translateMessageSchema, saveMessageSchema } from '../validators/schemas';

const router = Router();

// GET /api/v1/voice/messages — list user's messages and predefined communication cards
router.get('/messages', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('communication_messages')
      .select('*')
      .or(`user_id.eq.${req.user!.id},is_predefined.eq.true`)
      .order('is_predefined', { ascending: false })
      .order('created_at', { ascending: false });

    if (category && typeof category === 'string') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    sendSuccess(res, data || []);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/voice/translate — AI-powered translation via Gemini
router.post('/translate', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = translateMessageSchema.parse(req.body);

    const result = await geminiService.translateText(
      validated.text,
      validated.source_language,
      validated.target_language
    );

    if (!result.success || !result.data) {
      return sendError(res, 'TRANSLATION_ERROR', result.error || 'Failed to translate message.', 502);
    }

    sendSuccess(res, result.data);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/voice/messages — save a custom message
router.post('/messages', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = saveMessageSchema.parse(req.body);

    const { data, error } = await supabase
      .from('communication_messages')
      .insert({
        user_id: req.user!.id,
        category: validated.category,
        original_text: validated.original_text,
        translated_text: validated.translated_text || null,
        source_language: validated.source_language,
        target_language: validated.target_language || null,
        is_predefined: false,
      })
      .select()
      .single();

    if (error) throw error;
    sendSuccess(res, data, 'Communication message saved.', 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/voice/messages/:id — delete custom message
router.delete('/messages/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('communication_messages')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .eq('is_predefined', false);

    if (error) throw error;
    sendSuccess(res, null, 'Message deleted.');
  } catch (err) {
    next(err);
  }
});

export default router;

