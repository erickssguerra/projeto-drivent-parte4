import { AuthenticatedRequest } from "@/middlewares";
import bookingsService from "@/services/bookings-service";
import { Booking } from "@prisma/client";
import { Response } from "express";
import httpStatus from "http-status";

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  try {
    const booking = await bookingsService.postBooking(userId, roomId) as Booking;
    res.status(httpStatus.OK).send({ bookingId: booking.id });
  } catch (error) {
    if (error.name === "FullRoomError") {
      return res.status(httpStatus.FORBIDDEN).send(error.message);
    }
    if (error.name === "NotFoundError") {
      return res.status(httpStatus.NOT_FOUND).send(error.message);
    }
    if (error.name === "PaymentRequiredError") {
      return res.status(httpStatus.PAYMENT_REQUIRED).send(error.message);
    }
    res.sendStatus(httpStatus.BAD_REQUEST);
  }
}
