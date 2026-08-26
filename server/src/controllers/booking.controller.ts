import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createBooking,
  cancelBooking,
  getUserBookings,
} from '../services/booking.service';
import { AppError } from '../utils/errors';

const CreateBookingSchema = z.object({
  slotId: z.string().uuid(),
});

export const createBookingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slotId } = CreateBookingSchema.parse(req.body);
    const userId = req.user!.userId;

    const result = await createBooking(slotId, userId);

    if (!result.success) {
      const statusCode =
        result.code === 'NOT_FOUND'
          ? 404
          : result.code === 'ALREADY_BOOKED'
          ? 409
          : 409;

      res.status(statusCode).json({
        success: false,
        error: { code: result.code, message: result.error },
        data: { recommendations: result.recommendations || [] },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        booking: result.booking,
        slot: result.slot,
        facility: result.facility,
      },
      message: 'Booking confirmed!',
    });
  } catch (e) {
    next(e);
  }
};

export const cancelBookingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await cancelBooking(id, userId);
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (e) {
    next(e);
  }
};

export const myBookingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const bookings = await getUserBookings(userId);
    res.json({ success: true, data: bookings });
  } catch (e) {
    next(e);
  }
};
