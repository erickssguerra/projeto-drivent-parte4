import { prisma } from "@/config";

async function createBooking(userId: number, roomId: number) {
  return await prisma.booking.create({
    data: { userId, roomId },
  });
}

async function findRoom(roomId: number) {
  return await prisma.room.findFirst({
    where: {
      id: roomId,
    },
  });
}

async function decreaseRoomCapacity(roomId: number) {
  await prisma.room.update({
    where: { id: roomId },
    data: { capacity: { decrement: 1 } },
  });
}

async function findBookingByUserId(userId: number) {
  return await prisma.booking.findFirst({
    where: { userId },
    include: { Room: true },
  });
}

async function findBookingById(bookingId: number) {
  return await prisma.booking.findUnique({ where: { id: bookingId } });
}

async function updateBooking(bookingId: number, roomId: number) {
  return await prisma.booking.update({
    where: { id: bookingId },
    data: { roomId },
  });
}

async function increaseRoomCapacity(roomId: number) {
  await prisma.room.update({
    where: { id: roomId },
    data: { capacity: { increment: 1 } },
  });
}

const bookingRepository = {
  createBooking,
  findRoom,
  decreaseRoomCapacity,
  increaseRoomCapacity,
  findBookingByUserId,
  findBookingById,
  updateBooking,
};

export default bookingRepository;
