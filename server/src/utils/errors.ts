export enum AppErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SLOT_UNAVAILABLE = 'SLOT_UNAVAILABLE',
  ALREADY_BOOKED = 'ALREADY_BOOKED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: AppErrorCode;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: AppErrorCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(msg = 'Resource not found') {
    return new AppError(msg, 404, AppErrorCode.NOT_FOUND);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new AppError(msg, 401, AppErrorCode.UNAUTHORIZED);
  }
  static forbidden(msg = 'Forbidden') {
    return new AppError(msg, 403, AppErrorCode.FORBIDDEN);
  }
  static conflict(msg: string) {
    return new AppError(msg, 409, AppErrorCode.CONFLICT);
  }
  static slotUnavailable(msg = 'Slot is no longer available') {
    return new AppError(msg, 409, AppErrorCode.SLOT_UNAVAILABLE);
  }
  static validation(msg: string) {
    return new AppError(msg, 400, AppErrorCode.VALIDATION_ERROR);
  }
  static internal(msg = 'Internal server error') {
    return new AppError(msg, 500, AppErrorCode.INTERNAL_ERROR, false);
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
