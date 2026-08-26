import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../db/prisma';
import { AppError } from '../utils/errors';

const RegisterSchema = z.object({
  rollNo: z.string().min(4).max(20),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function signAccess(userId: string, role: string) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET || 'fallback_access',
    { expiresIn: '15m' }
  );
}

function signRefresh(userId: string) {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh',
    { expiresIn: '7d' }
  );
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = RegisterSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { rollNo: data.rollNo }] },
    });
    if (existing) {
      throw AppError.conflict('Email or Roll Number already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        rollNo: data.rollNo,
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'student',
      },
      select: { id: true, name: true, email: true, rollNo: true, role: true },
    });

    const accessToken = signAccess(user.id, user.role);
    const refreshToken = signRefresh(user.id);

    res.status(201).json({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  } catch (e) {
    next(e);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw AppError.unauthorized('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    const accessToken = signAccess(user.id, user.role);
    const refreshToken = signRefresh(user.id);

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, rollNo: user.rollNo, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (e) {
    next(e);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw AppError.unauthorized('No refresh token');

    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh'
    ) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw AppError.unauthorized('User not found');

    const newAccess = signAccess(user.id, user.role);
    const newRefresh = signRefresh(user.id);

    res.json({ success: true, data: { accessToken: newAccess, refreshToken: newRefresh } });
  } catch (e) {
    next(e);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, rollNo: true, role: true, priority: true, createdAt: true },
    });
    if (!user) throw AppError.notFound('User not found');
    res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
};
