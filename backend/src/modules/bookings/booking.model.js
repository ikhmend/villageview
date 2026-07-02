import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";

export class Booking extends Model {}

Booking.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    guestName: { type: DataTypes.STRING(120), allowNull: false, field: "guest_name" },
    phone: { type: DataTypes.STRING(40), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false, validate: { isEmail: true } },
    guests: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 2, validate: { min: 1, max: 2 } },
    checkin: { type: DataTypes.DATEONLY, allowNull: false },
    checkout: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM("pending", "confirmed", "cancelled"), allowNull: false, defaultValue: "pending" },
    pendingExpiresAt: { type: DataTypes.DATE, allowNull: true, field: "pending_expires_at" },
    notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
  },
  {
    sequelize,
    modelName: "Booking",
    tableName: "bookings",
    timestamps: true,
    defaultScope: { order: [["checkin", "ASC"]] },
  },
);
