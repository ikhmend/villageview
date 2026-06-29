"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("admin_users", "token_version", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.createTable("admin_password_reset_tokens", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
        primaryKey: true,
      },
      admin_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "admin_users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      token_hash: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.addIndex("admin_password_reset_tokens", ["admin_user_id", "expires_at"], {
      name: "admin_password_reset_tokens_admin_expiry_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("admin_password_reset_tokens");
    await queryInterface.removeColumn("admin_users", "token_version");
  },
};
