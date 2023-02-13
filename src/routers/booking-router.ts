import { Router } from "express";
import { authenticateToken, validateBody, validateParams } from "@/middlewares";
import { roomIdSchema } from "@/schemas";
import { getBookings, postBooking, updateBooking } from "@/controllers";
import { bookingIdSchema } from "@/schemas/booking-id-schema";

const bookingsRouter = Router();

bookingsRouter
  .all("/*", authenticateToken)
  .post("/", validateBody(roomIdSchema), postBooking)
  .get("/", getBookings)
  .put(
    "/:bookingId",
    validateBody(roomIdSchema),
    validateParams(bookingIdSchema),
    updateBooking
  );

export { bookingsRouter };
