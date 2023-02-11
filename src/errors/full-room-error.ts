import { ApplicationError } from "@/protocols";

export function fullRoomError(): ApplicationError{
    return {
        name: "FullRoomError",
        message: "This room is at full capacity!"
    }
}