import { app } from "./app.js";
import { sequelize } from "./config/database.js";
import { env } from "./config/env.js";
import * as http from 'node:http';
import { Server } from 'socket.io';
import { authBusinessService } from "./modules/auth/auth.business.service.js";
const httpServer = http.createServer(app);
const io = new Server(httpServer, {cors: {
  origin: env.CLIENT_ORIGIN,
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
    socket.admin = admin;
    next();
  } catch {
    next(new Error("Хүчингүй/хугацаа дууссан токен"));
  }
});
io.on("connection", (socket) => {
  socket.join("admins")
  console.log("Admin connected:", socket.id);
  socket.on("disconnect", () => {
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
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
  await sequelize.close();
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
