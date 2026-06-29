import { Sequelize } from "sequelize";
import { env } from "./env.js";

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: "postgres",
  logging: env.NODE_ENV === "development" ? (message) => console.debug(message) : false,
  dialectOptions: env.DATABASE_SSL
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {}, 
  define: {
    underscored: true,
    freezeTableName: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
