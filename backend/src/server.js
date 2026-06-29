import { app } from "./app.js";
import { sequelize } from "./config/database.js";
import { env } from "./config/env.js";
let server;
async function start() {
  try {
    await sequelize.authenticate();
    server = app.listen(env.PORT, () => {
      console.log(`Village View API listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Unable to start the API", error);
    process.exit(1);
  }
}
async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully.`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
