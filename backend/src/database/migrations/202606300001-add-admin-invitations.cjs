"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("admin_users", "invitation_accepted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.sequelize.query(`
      UPDATE "admin_users"
      SET "invitation_accepted_at" = COALESCE("last_login_at", "created_at", NOW())
      WHERE "invitation_accepted_at" IS NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("admin_users", "invitation_accepted_at");
  },
};
