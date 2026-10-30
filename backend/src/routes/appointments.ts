import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { supabaseAdmin, supabase } from '../config/supabase';
import { createAppointmentSchema } from '../validators/schemas';

const router = Router();

// GET /api/v1/appointments — user's appointments
router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(*),
        slot:appointment_slots(*)
      `)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    sendSuccess(res, data || []);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/appointments/:id — specific appointment
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(*),
        slot:appointment_slots(*)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !data) {
      return sendError(res, 'APPOINTMENT_NOT_FOUND', 'Appointment not found.', 404);
    }

    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/appointments — transactional booking
router.post('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = createAppointmentSchema.parse(req.body);

    // Call PostgreSQL transactional booking function via service role
    const { data, error } = await supabaseAdmin.rpc('book_appointment', {
      p_user_id: req.user!.id,
      p_service_id: validated.service_id,
      p_slot_id: validated.slot_id,
      p_accessibility_requirements: JSON.stringify(validated.accessibility_requirements),
      p_additional_instructions: validated.additional_instructions || '',
    });

    if (error) {
      if (error.message.includes('SLOT_NOT_FOUND')) {
        return sendError(res, 'SLOT_NOT_FOUND', 'Appointment slot is not available.', 404);
      }
      if (error.message.includes('SLOT_FULL')) {
        return sendError(res, 'SLOT_FULL', 'Appointment slot is fully booked.', 409);
      }
      if (error.message.includes('DUPLICATE_BOOKING')) {
        return sendError(res, 'DUPLICATE_BOOKING', 'You already have an active appointment for this slot.', 409);
      }
      throw error;
    }

    sendSuccess(res, data, 'Appointment requested successfully.', 201);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/appointments/:id/cancel — cancel appointment
router.post('/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const { data: existing } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Appointment not found.', 404);
    }

    if (['cancelled', 'completed'].includes(existing.status)) {
      return sendError(res, 'INVALID_STATE', 'Cannot cancel an appointment that is already cancelled or completed.', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellation_reason || 'Cancelled by user',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Decrement slot booked count
    try {
      await supabaseAdmin.rpc('decrement_slot_booking', { p_slot_id: existing.slot_id });
    } catch {
      // Ignored if RPC doesn't exist
    }

    sendSuccess(res, data, 'Appointment cancelled successfully.');
  } catch (err) {
    next(err);
  }
});

export default router;
