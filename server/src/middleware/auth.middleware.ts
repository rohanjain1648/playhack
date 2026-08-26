import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import prisma from '../db/prisma';

export interface AuthPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ACCESS_SECRET || 'fallback_secret';

    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(AppError.unauthorized('Token expired'));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid token'));
    } else {
      next(err);
    }
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    next(AppError.forbidden('Admin access required'));
    return;
  }
  next();
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  try {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ACCESS_SECRET || 'fallback_secret';
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
  } catch {
    // ignore
  }
  next();
};
