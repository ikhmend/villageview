"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_max_seven_nights"
      CHECK ("checkout" <= "checkin" + 7) NOT VALID;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "bookings"
      DROP CONSTRAINT IF EXISTS "bookings_max_seven_nights";
    `);
  },
};
