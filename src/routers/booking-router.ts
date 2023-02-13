import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { roomIdSchema } from "@/schemas";
import { getBookings, postBooking } from "@/controllers";

const bookingsRouter = Router();

bookingsRouter
  .all("/*", authenticateToken)
  .post("/", validateBody(roomIdSchema), postBooking)
  .get("/", getBookings)

export { bookingsRouter };
