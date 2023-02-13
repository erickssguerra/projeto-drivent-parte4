import Joi from "joi";

export const bookingIdSchema = Joi.object({
    bookingId: Joi.number().integer().min(0).required()
})