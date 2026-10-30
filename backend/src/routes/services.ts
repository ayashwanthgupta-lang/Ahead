import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/v1/services — list all active college services
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

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

// GET /api/v1/services/:id — service details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return sendError(res, 'SERVICE_NOT_FOUND', 'Service not found.', 404);
    }

    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/services/:id/slots — available appointment slots for service
router.get('/:id/slots', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('service_id', id)
      .eq('status', 'available')
      .gt('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    if (error) throw error;

    sendSuccess(res, data || []);
  } catch (err) {
    next(err);
  }
});

export default router;

