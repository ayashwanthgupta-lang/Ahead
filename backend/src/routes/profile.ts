import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { supabase } from '../config/supabase';
import { updateProfileSchema } from '../validators/schemas';

const router = Router();

// GET /api/v1/profile
router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) {
      return sendError(res, 'PROFILE_NOT_FOUND', 'Profile could not be found.', 404);
    }

    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/profile
router.patch('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = updateProfileSchema.parse(req.body);

    const { data, error } = await supabase
      .from('profiles')
      .update(validated)
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) throw error;
    sendSuccess(res, data, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
});

export default router;

