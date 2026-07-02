"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn("bookings", "pending_expires_at", {
        type: Sequelize.DATE,
        allowNull: true,
      }, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE "bookings"
        SET "pending_expires_at" = "created_at" + INTERVAL '7 days'
        WHERE "status" = 'pending';
      `, { transaction });
      await queryInterface.addIndex("bookings", ["status", "pending_expires_at"], {
        name: "bookings_pending_expiration_idx",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("bookings", "bookings_pending_expiration_idx", { transaction });
      await queryInterface.removeColumn("bookings", "pending_expires_at", { transaction });
    });
  },
};
