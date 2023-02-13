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

async function updateRoomCapacity(roomId: number) {
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

const bookingRepository = {
  createBooking,
  findRoom,
  updateRoomCapacity,
  findBookingByUserId,
};

export default bookingRepository;
