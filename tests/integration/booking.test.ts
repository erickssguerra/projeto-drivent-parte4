import app, { init } from "@/app";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createHotel,
  createRoomWithHotelId,
  createTicket,
  createTicketType,
  createUser,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";
import * as jwt from "jsonwebtoken";
import { TicketStatus } from "@prisma/client";
import { createBooking } from "../factories/bookings-factory";

beforeAll(async () => {
  await init();
  await cleanDb();
});
const server = supertest(app);

describe("POST /booking", () => {
  describe("when token is not valid", () => {
    it("should respond with status 401 if no Authorization header is given", async () => {
      const response = await server.post("/booking");

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();
      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign(
        { userId: userWithoutSession.id },
        process.env.JWT_SECRET
      );
      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe("when token is valid", () => {
    it("should respond with status 400 when the body is not being sent", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 when the roomId is not valid ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: -1 };
      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 404 when user has no enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: 0 };
      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when user has no ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const body = { roomId: 0 };
      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 402 when ticketType does not include hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = false;
      const includesHotel = false;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const body = { roomId: 0 };

      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 when ticketType is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = true;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const body = { roomId: 0 };

      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 when ticket is not paid yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const body = { roomId: 0 };
      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });
  });

  describe("when token and ticket are valid", () => {
    it("should respond with status 404 when the roomId does not exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const body = { roomId: 0 };
      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 when the room is at full capacity", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const capacity = 0;
      const room = await createRoomWithHotelId(hotel.id, capacity);

      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 200 and bookingId in case of success", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);
      const bookingId = booking.id + 1; //the +1 is due to the duplicated req

      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({ bookingId });
    });
  });
});

describe("GET /booking", () => {
  describe("when token is not valid", () => {
    it("should respond with status 401 if no Authorization header is given", async () => {
      const response = await server.get("/booking");

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();
      const response = await server
        .get("/booking")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign(
        { userId: userWithoutSession.id },
        process.env.JWT_SECRET
      );
      const response = await server
        .get("/booking")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user has no booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server
        .get("/booking")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and booking infos in case of success", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);

      const response = await server
        .get("/booking")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: room.hotelId,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      });
    });
  });
});

describe("PUT /booking/:bookingId", () => {
  describe("when token is not valid", () => {
    it("should respond with status 401 if no Authorization header is given", async () => {
      const response = await server.put("/booking/0");

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();
      const response = await server
        .put("/booking/0")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign(
        { userId: userWithoutSession.id },
        process.env.JWT_SECRET
      );
      const response = await server
        .put("/booking/0")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe("when token is valid", () => {
    it("should respond with status 400 when the body is not being sent", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server
        .put("/booking/0")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 when roomId is not valid ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: -1 };
      const response = await server
        .put("/booking/0")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 400 when bookingId param is not valid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: 0 };
      const response = await server
        .put("/booking/-1")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });

    it("should respond with status 404 when user has no booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const body = { roomId: 0 };
      const response = await server
        .put("/booking/0")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when bookingId does not exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await createBooking(user.id, room.id);

      const response = await server
        .put("/booking/0")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe("when token, roomId and bookingId are valid", () => {
    it("should respond with status 403 when the desired room is at full capacity", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const capacity = 0;
      const room = await createRoomWithHotelId(hotel.id, capacity);
      const booking = await createBooking(user.id, room.id);

      const response = await server
        .put(`/booking/${booking.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when user is not the booking owner", async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      const token1 = await generateValidToken(user1);
      const enrollment1 = await createEnrollmentWithAddress(user1);
      const enrollment2 = await createEnrollmentWithAddress(user2);
      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment1.id, ticketType.id, TicketStatus.PAID);
      await createTicket(enrollment2.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await createBooking(user1.id, room.id);
      const booking2 = await createBooking(user2.id, room.id);

      const response = await server
        .put(`/booking/${booking2.id}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 200 and bookingId in case of success", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);

      const response = await server
        .put(`/booking/${booking.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({ bookingId: booking.id });
    });
  });
});
