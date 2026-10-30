import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/v1/auth/me — returns current user from verified token
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) throw error;
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout — handled client-side via Supabase; backend just acknowledges
router.post('/logout', requireAuth, (_req, res) => {
  sendSuccess(res, null, 'Logged out successfully.');
});

export default router;

