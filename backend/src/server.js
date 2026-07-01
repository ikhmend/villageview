import { app } from "./app.js";
import { sequelize } from "./config/database.js";
import { env } from "./config/env.js";
import * as http from 'node:http';
import { Server } from 'socket.io';
import { authBusinessService } from "./modules/auth/auth.business.service.js";
import jwt from "jsonwebtoken";
import { disconnectAdminSockets } from "./common/services/socket.service.js";
const httpServer = http.createServer(app);
const clientOrigins = String(env.CLIENT_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const io = new Server(httpServer, {cors: {
  origin: clientOrigins,
  credentials:true,
}});
app.set("io", io);
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    const admin = await authBusinessService.authenticateToken(token);
    const payload = jwt.decode(token);
    if (!payload?.exp) {
      return next(new Error("Token expiration is missing"));
    }
    socket.admin = admin;
    socket.tokenExpiresAt= payload.exp*1000;
    next();
  } catch {
    next(new Error("Хүчингүй/хугацаа дууссан токен"));
  }
});
io.on("connection", (socket) => {
  const adminRoom= `admin:${socket.admin.id}`;
  socket.join("admins");
  socket.join(adminRoom);
  const remainingTime= socket.tokenExpiresAt- Date.now();
  if(remainingTime <=0){
    socket.disconnect(true);
    return;
  }
  const expireTime= setTimeout(()=>{
    socket.disconnect(true);},
    remainingTime
  )
  console.log("Admin connected:", socket.id);
  socket.on("disconnect", () => {
    clearTimeout(expireTime);
    console.log("Admin disconnected:", socket.id);
  });
});
async function start() {
  try {
    await sequelize.authenticate();
    httpServer.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Unable to start the API", error);
    process.exit(1);
  }
}
async function shutdown(signal) {
  console.log(`${signal} received. Shutting down.`);
  await new Promise((resolve) => {
    io.close(resolve);
  });
  await sequelize.close();
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
