// src/components/socketio/VideoCallSocket.js
import { io } from "socket.io-client";

let socket = null;

/**
 * Initialize and return the Socket.IO client instance.
 * Adds auth token from localStorage and forces WebSocket transport.
 */
export const getSocket = () => {
  if (!socket) {
    // Attempt to read user token from localStorage
    let token;
    try {
      const stored = localStorage.getItem("userData");
      const parsed = stored ? JSON.parse(stored) : {};
      token = parsed.token;
    } catch {
      token = undefined;
    }
    socket = io(import.meta.env.VITE_API_SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
      autoConnect: true,
    });
  }
  return socket;
};

/**
 * Disconnects and resets the Socket.IO client instance.
 */
export const setSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  getSocket,
  setSocket,
};
