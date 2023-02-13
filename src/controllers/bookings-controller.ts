import { AuthenticatedRequest } from "@/middlewares";
import { GetBooking } from "@/protocols";
import bookingsService from "@/services/bookings-service";
import { Booking } from "@prisma/client";
import { Response } from "express";
import httpStatus from "http-status";

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  try {
    const booking = (await bookingsService.postBooking(
      userId,
      roomId
    )) as Booking;
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

export async function getBookings(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  try {
    const booking = (await bookingsService.getBookings(userId)) as GetBooking;
    res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(httpStatus.NOT_FOUND).send(error.message);
    }
    res.sendStatus(httpStatus.BAD_REQUEST);
  }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { bookingId } = req.params;
  const { roomId } = req.body;
  try {
    const booking = await bookingsService.updateBooking(
      userId,
      Number(bookingId),
      roomId
    );
    res.status(httpStatus.OK).send({ bookingId: booking.id });
  } catch (error) {
    if (error.name === "ForbiddenError") {
      return res.status(httpStatus.FORBIDDEN).send(error.message);
    }
    if (error.name === "NotFoundError") {
      return res.status(httpStatus.NOT_FOUND).send(error.message);
    }
    if (error.name === "FullRoomError") {
      return res.status(httpStatus.FORBIDDEN).send(error.message);
    }
    res.sendStatus(httpStatus.BAD_REQUEST);
  }
}
