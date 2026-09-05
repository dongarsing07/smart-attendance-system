import { io } from "socket.io-client";

const socket = io(
  process.env.REACT_APP_API_URL?.replace("/api", ""),
  {
    transports: ["websocket"],
    withCredentials: true,
  }
);

export default socket;