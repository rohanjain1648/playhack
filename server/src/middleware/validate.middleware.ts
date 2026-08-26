import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const validate =
  (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(AppError.validation(messages));
        return;
      }
      req[source] = result.data;
      next();
    } catch (e) {
      next(AppError.validation('Invalid request data'));
    }
  };
