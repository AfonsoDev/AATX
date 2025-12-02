// socket.js
import { io } from "socket.io-client";
import { API_URL } from "./config";

export const socket = io(API_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
});

socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
});

socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
});
