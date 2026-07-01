"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        ALTER TABLE "bookings"
        DROP CONSTRAINT "bookings_no_confirmed_overlap",
        ADD CONSTRAINT "bookings_no_active_overlap"
        EXCLUDE USING gist (
          daterange("checkin", "checkout", '[)') WITH &&
        ) WHERE ("status" IN ('pending', 'confirmed'));
      `, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        ALTER TABLE "bookings"
        DROP CONSTRAINT "bookings_no_active_overlap",
        ADD CONSTRAINT "bookings_no_confirmed_overlap"
        EXCLUDE USING gist (
          daterange("checkin", "checkout", '[)') WITH &&
        ) WHERE ("status" = 'confirmed');
      `, { transaction });
    });
  },
};
