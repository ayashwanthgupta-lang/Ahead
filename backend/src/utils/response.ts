import { Response } from 'express';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): void {
  const errorObj: { code: string; message: string; details?: unknown } = {
    code,
    message,
  };
  if (details !== undefined) {
    errorObj.details = details;
  }
  const response: ApiErrorResponse = {
    success: false,
    error: errorObj,
  };
  res.status(statusCode).json(response);
}
