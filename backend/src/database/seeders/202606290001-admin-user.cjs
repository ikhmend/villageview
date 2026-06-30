"use strict";
require("dotenv").config();
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
module.exports = {
  async up(queryInterface) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password.length < 12) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) are required to seed the admin user");
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await queryInterface.sequelize.query(`
      INSERT INTO "admin_users"
        ("id", "email", "password_hash", "name", "is_active", "token_version", "invitation_accepted_at", "created_at", "updated_at")
      VALUES
        (:id, :email, :passwordHash, 'Village View Admin', true, 0, NOW(), NOW(), NOW())
      ON CONFLICT ("email") DO UPDATE SET
        "password_hash" = EXCLUDED."password_hash",
        "is_active" = true,
        "invitation_accepted_at" = COALESCE("admin_users"."invitation_accepted_at", NOW()),
        "token_version" = "admin_users"."token_version" + 1,
        "updated_at" = NOW();
    `, {
      replacements: { id: crypto.randomUUID(), email, passwordHash },
    }); 
  },
  async down(queryInterface) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (email) await queryInterface.bulkDelete("admin_users", { email });
  },
};
