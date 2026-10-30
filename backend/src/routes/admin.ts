import { Router } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { supabaseAdmin } from '../config/supabase';
import { createServiceSchema, createSlotSchema, updateAppointmentStatusSchema } from '../validators/schemas';

const router = Router();

// Apply auth + admin verification to ALL admin routes
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/v1/admin/services — all services including inactive
router.get('/services', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    sendSuccess(res, data || []);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/services — create a service
router.post('/services', async (req, res, next) => {
  try {
    const validated = createServiceSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('services')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;
    sendSuccess(res, data, 'Service created successfully.', 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/services/:id — update a service
router.patch('/services/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = createServiceSchema.partial().parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('services')
      .update(validated)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    sendSuccess(res, data, 'Service updated successfully.');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/appointments — all appointments
router.get('/appointments', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        user:profiles(id, full_name, preferred_language),
        service:services(name, category, location),
        slot:appointment_slots(starts_at, ends_at)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    sendSuccess(res, data || []);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/appointments/:id/status — confirm, reject, or complete
router.patch('/appointments/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancellation_reason } = updateAppointmentStatusSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status,
        ...(cancellation_reason ? { cancellation_reason } : {}),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    sendSuccess(res, data, `Appointment status updated to ${status}.`);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/slots — add appointment slot
router.post('/slots', async (req, res, next) => {
  try {
    const validated = createSlotSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('appointment_slots')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;
    sendSuccess(res, data, 'Appointment slot created.', 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/slots/:id
router.delete('/slots/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('appointment_slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
    sendSuccess(res, null, 'Slot removed successfully.');
  } catch (err) {
    next(err);
  }
});

export default router;

