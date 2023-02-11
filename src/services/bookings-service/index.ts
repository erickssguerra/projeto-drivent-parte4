import { notFoundError } from "@/errors";
import { fullRoomError } from "@/errors/full-room-error";
import { paymentRequiredError } from "@/errors/payment-required-error";
import bookingRepository from "@/repositories/booking-repositoyr";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { Booking } from "@prisma/client";

async function checkEnrollmentAndTicket(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw notFoundError();
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw notFoundError();
  if (
    ticket.status !== "PAID" ||
    ticket.TicketType.includesHotel === false ||
    ticket.TicketType.isRemote === true
  ) {
    throw paymentRequiredError();
  }
}

async function checkRoom(roomId: number) {
  const room = await bookingRepository.findRoom(roomId);
  if (!room) throw notFoundError();
  if (room.capacity < 1) throw fullRoomError();
}

async function updateRoomCapacity(roomId: number) {
  await bookingRepository.updateRoomCapacity(roomId);
}

async function postBooking(userId: number, roomId: number) {
  await checkEnrollmentAndTicket(userId);
  await checkRoom(roomId);
  await updateRoomCapacity(roomId);
  (await bookingRepository.createBooking(userId, roomId)) as Booking;
}

const bookingsService = {
  postBooking,
};

export default bookingsService;
