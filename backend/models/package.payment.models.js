

import mongoose from "mongoose";

const packagePaymentSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller", // Reference to the Seller collection
            required: true,
        },
        packageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Package",
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["M-Pesa", "Card", "Bank Transfer"],
            default: "M-Pesa",
        },
        amount: {
            type: Number,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        transactionId: {
            type: String,
            unique: true,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Completed", "Failed"],
            default: "Pending",
        },
        providerResponse: {
            type: Object,
            default: {},
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
        },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

export const PackagePayment = mongoose.model("PackagePayment", packagePaymentSchema);
