import { Request, Response, NextFunction } from 'express';
import { isAppError, AppError, AppErrorCode } from '../utils/errors';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Prisma unique constraint violation
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as any).code === 'P2002'
  ) {
    res.status(409).json({
      success: false,
      error: {
        code: AppErrorCode.CONFLICT,
        message: 'Resource already exists (unique constraint violation)',
      },
    });
    return;
  }

  if (isAppError(err)) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Unknown error
  console.error('[Unhandled Error]', err);
  const message =
    process.env.NODE_ENV === 'development' && err instanceof Error
      ? err.message
      : 'An unexpected error occurred';

  res.status(500).json({
    success: false,
    error: {
      code: AppErrorCode.INTERNAL_ERROR,
      message,
    },
  });
};
