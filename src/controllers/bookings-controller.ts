import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { roomId } = req.body;
  try {
     res.status(httpStatus.OK).send({ roomId });
  } catch (error) {
    res.sendStatus(httpStatus.BAD_REQUEST);
  }
}
