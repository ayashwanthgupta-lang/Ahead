import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  console.error('[ErrorHandler]', err.message);

  if (err instanceof ZodError) {
    sendError(
      res,
      'VALIDATION_ERROR',
      'Please check your input.',
      400,
      err.flatten().fieldErrors
    );
    return;
  }

  // Booking-specific errors from database functions
  if (err.message.startsWith('SLOT_NOT_FOUND:')) {
    sendError(res, 'SLOT_NOT_FOUND', 'The requested appointment slot is not available.', 409);
    return;
  }

  if (err.message.startsWith('SLOT_FULL:')) {
    sendError(res, 'SLOT_FULL', 'This appointment slot is fully booked.', 409);
    return;
  }

  if (err.message.startsWith('DUPLICATE_BOOKING:')) {
    sendError(res, 'DUPLICATE_BOOKING', 'You already have a booking for this slot.', 409);
    return;
  }

  sendError(res, 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again.', 500);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.path} not found.`, 404);
}
