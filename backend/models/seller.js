
import  { Schema, model } from "mongoose";

const sellerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // Automatically remove trailing spaces
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensure unique emails for sellers
      lowercase: true, // Automatically convert to lowercase
    },
    password: {
      type: String,
      required: true,
      select: false, // Exclude password in queries by default
    },
    role: {
      type: String,
      enum: ["seller", "admin"], // Limit roles to predefined values
      default: "seller",
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "banned"],
      default: "pending", // Default status for new sellers
    },
    paymentStatus: {
      type: String,
      enum: ["inactive", "active", "overdue"],
      default: "inactive", // Default payment status
    },
    paymentMethod: {
      type: String,
      enum: ["M-Pesa", "Bank Transfer", "PayPal", "Card"], // Predefined payment methods
      default: "M-Pesa",
    },
    profileImage: {
      type: String,
      default: "", // Placeholder for profile images
    },
    shopInfo: {
      name: { type: String, default: "" },
      description: { type: String, default: "" },
      address: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
    },
    subscription: {
      packageType: {
        type: String,
        enum: ["Free", "Silver", "Gold", "Diamond"],
        default: "Free",
      },
      renewalDate: {
        type: Date,
        default: null, // Set when the subscription is activated
      },
    },
    contactPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Text index for name and email for better search capabilities
sellerSchema.index(
  {
    name: "text",
    email: "text",
  },
  {
    weights: {
      name: 5,
      email: 4,
    },
  }
);

// Middleware to hash passwords before saving
sellerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const bcrypt = require("bcrypt");
  this.password = await bcrypt.hash(this.password, 10); // Hash password with bcrypt
  next();
});

export const Seller = model("Seller", sellerSchema);
