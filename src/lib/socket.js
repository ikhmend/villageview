import { io } from "socket.io-client";
import { authToken } from "./api";
const socketUrl = import.meta.env.VITE_SOCKET_URL;
export const socket = io(socketUrl, {
  autoConnect: false,
  auth: (callback)=>{
    callback({
      token:authToken.get(),
    });
  },
});