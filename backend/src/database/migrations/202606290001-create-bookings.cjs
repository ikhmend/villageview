"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "btree_gist";');
    await queryInterface.createTable("bookings", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
        primaryKey: true,
      },
      guest_name: { type: Sequelize.STRING(120), allowNull: false },
      phone: { type: Sequelize.STRING(40), allowNull: false },
      email: { type: Sequelize.STRING(254), allowNull: false },
      guests: { type: Sequelize.SMALLINT, allowNull: false, defaultValue: 2 },
      checkin: { type: Sequelize.DATEONLY, allowNull: false },
      checkout: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM("pending", "confirmed", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      notes: { type: Sequelize.TEXT, allowNull: false, defaultValue: "" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_checkout_after_checkin" CHECK ("checkout" > "checkin"),
      ADD CONSTRAINT "bookings_guests_range" CHECK ("guests" BETWEEN 1 AND 2);
    `);
    await queryInterface.addIndex("bookings", ["status"], { name: "bookings_status_idx" });
    await queryInterface.addIndex("bookings", ["checkin", "checkout"], { name: "bookings_dates_idx" });
    await queryInterface.sequelize.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_no_confirmed_overlap"
      EXCLUDE USING gist (
        daterange("checkin", "checkout", '[)') WITH &&
      ) WHERE ("status" = 'confirmed');
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("bookings");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bookings_status";');
  },
};
