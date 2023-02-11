import { AuthenticatedRequest } from "@/middlewares";
import bookingsService from "@/services/bookings-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  try {
    await bookingsService.postBooking(userId, roomId);
    res.status(httpStatus.OK).send({ roomId });
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
