import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { supabase } from '../config/supabase';
import { updatePreferencesSchema } from '../validators/schemas';

const router = Router();

// GET /api/v1/preferences
router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('accessibility_preferences')
      .select('*')
      .eq('user_id', req.user!.id);

    if (error) throw error;
    sendSuccess(res, data || []);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/preferences
router.put('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { preferences } = updatePreferencesSchema.parse(req.body);

    // Upsert preferences for the authenticated user
    const rows = preferences.map((p) => ({
      user_id: req.user!.id,
      preference_key: p.preference_key,
      preference_value: p.preference_value,
    }));

    // Delete existing and insert fresh
    await supabase.from('accessibility_preferences').delete().eq('user_id', req.user!.id);

    if (rows.length > 0) {
      const { data, error } = await supabase
        .from('accessibility_preferences')
        .insert(rows)
        .select();

      if (error) throw error;
      return sendSuccess(res, data, 'Accessibility preferences updated successfully.');
    }

    sendSuccess(res, [], 'Preferences cleared.');
  } catch (err) {
    next(err);
  }
});

export default router;

