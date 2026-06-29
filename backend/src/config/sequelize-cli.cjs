require("dotenv").config();

const useSsl = process.env.DATABASE_SSL === "true";

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: useSsl ? { ssl: { require: false, rejectUnauthorized: false } } : {},
  },
  test: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres", 
    logging: false,
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: false,
    dialectOptions: useSsl ? { ssl: { require: false, rejectUnauthorized: false } } : {},
  },
};
