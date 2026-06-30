import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";

export class AdminUser extends Model {
  toSafeJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      isActive: this.isActive,
      invitationAcceptedAt: this.invitationAcceptedAt,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
    };
  }
}

AdminUser.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(254), allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false, field: "password_hash" },
    name: { type: DataTypes.STRING(120), allowNull: false, defaultValue: "Village View Admin" },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: "last_login_at" },
    tokenVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "token_version" },
    invitationAcceptedAt: { type: DataTypes.DATE, allowNull: true, field: "invitation_accepted_at" },
  },
  {
    sequelize,
    modelName: "AdminUser",
    tableName: "admin_users",
    timestamps: true,
    defaultScope: { attributes: { exclude: ["passwordHash"] } },
    scopes: { withPassword: { attributes: { include: ["passwordHash"] } } },
  },
);
