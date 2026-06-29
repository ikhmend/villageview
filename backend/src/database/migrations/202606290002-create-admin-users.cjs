"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admin_users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
        primaryKey: true,
      },
      email: { type: Sequelize.STRING(254), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(100), allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false, defaultValue: "Village View Admin" },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("admin_users");
  },
};
