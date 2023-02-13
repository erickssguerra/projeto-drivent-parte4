import {
  notFoundError,
  fullRoomError,
  paymentRequiredError,
  forbiddenError,
} from "@/errors";
import { GetBooking } from "@/protocols";
import bookingRepository from "@/repositories/booking-repositoyr";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { Booking } from "@prisma/client";

async function postBooking(userId: number, roomId: number): Promise<Booking> {
  await checkEnrollmentAndTicket(userId);
  await checkRoom(roomId);
  await decreaseRoomCapacity(roomId);
  return await bookingRepository.createBooking(userId, roomId);
}

async function getBookings(userId: number) {
  const booking = await checkBookingByUserId(userId);
  return { id: booking.id, Room: booking.Room } as GetBooking;
}

async function updateBooking(
  userId: number,
  bookingId: number,
  roomId: number
) {
  const validBooking = await checkBookings(userId, bookingId);
  await checkRoom(roomId);
  await decreaseRoomCapacity(roomId);
  await increaseRoomCapacity(validBooking.roomId);
  return (await bookingRepository.updateBooking(bookingId, roomId)) as Booking;
}

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

async function decreaseRoomCapacity(roomId: number) {
  await bookingRepository.decreaseRoomCapacity(roomId);
}

async function checkBookingByUserId(userId: number) {
  const booking = await bookingRepository.findBookingByUserId(userId);
  if (!booking) throw notFoundError();
  return booking;
}

async function checkBookingById(bookingId: number) {
  const booking = await bookingRepository.findBookingById(bookingId);
  if (!booking) throw notFoundError();
  return booking;
}
async function checkBookings(userId: number, bookingId: number) {
  const userBooking = await checkBookingByUserId(userId);
  const paramsBooking = await checkBookingById(bookingId);
  if (userBooking.id !== paramsBooking.id) throw forbiddenError();
  return paramsBooking;
}

async function increaseRoomCapacity(roomId: number) {
  await bookingRepository.increaseRoomCapacity(roomId);
}

const bookingsService = {
  postBooking,
  getBookings,
  updateBooking,
};

export default bookingsService;
