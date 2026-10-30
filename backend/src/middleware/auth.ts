import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { sendError } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
    return;
  }

  const token = authHeader.substring(7);

  try {
    // Verify token with Supabase
    const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      sendError(res, 'UNAUTHORIZED', 'Invalid or expired session. Please log in again.', 401);
      return;
    }

    // Fetch role from profiles table
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user',
    };

    next();
  } catch (err) {
    sendError(res, 'AUTH_ERROR', 'Authentication failed.', 401);
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !['admin', 'staff'].includes(req.user.role || '')) {
    sendError(res, 'FORBIDDEN', 'Administrative access required.', 403);
    return;
  }
  next();
}
