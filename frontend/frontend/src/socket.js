import { io } from "socket.io-client";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

console.log("Socket connecting to:", SOCKET_URL);

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;