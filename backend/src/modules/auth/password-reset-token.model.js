import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";

export class PasswordResetToken extends Model {}

PasswordResetToken.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    adminUserId: { type: DataTypes.UUID, allowNull: false, field: "admin_user_id" },
    tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true, field: "token_hash" },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
    usedAt: { type: DataTypes.DATE, allowNull: true, field: "used_at" },
  },
  {
    sequelize,
    modelName: "PasswordResetToken",
    tableName: "admin_password_reset_tokens",
    timestamps: true,
  },
);
