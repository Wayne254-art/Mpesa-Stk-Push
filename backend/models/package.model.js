import mongoose from "mongoose";

const packageOptions = ["Free", "Silver", "Gold", "Diamond"];

const UserPackageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    packageType: {
        type: String,
        enum: packageOptions,
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "expired", "pending"],
        default: "pending", // Pending until payment confirmation
    },
    paymentReference: {
        type: String,
        required: false, // Payment reference may not always be needed initially
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "failed"],
        default: "unpaid", // Default to unpaid until payment confirmation
    },
    startDate: {
        type: Date,
        default: null, // Null until activation
    },
    renewalDate: {
        type: Date,
        default: null, // Null until activation
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to update the `updatedAt` field automatically
UserPackageSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

// Check if the package is expired
UserPackageSchema.methods.isExpired = function () {
    return this.renewalDate && new Date() > this.renewalDate;
};

// Renew the package
UserPackageSchema.methods.renew = function () {
    this.status = "active";
    this.startDate = new Date();
    this.renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};

// Upgrade the package
UserPackageSchema.methods.upgrade = function (newPackageType, paymentReference) {
    if (!packageOptions.includes(newPackageType)) {
        throw new Error("Invalid package type.");
    }
    this.packageType = newPackageType;
    this.paymentReference = paymentReference || null;
    this.status = "pending"; // Set to pending until payment is confirmed
    this.paymentStatus = "unpaid"; // Reset payment status
    this.startDate = null; // Reset start date
    this.renewalDate = null; // Reset renewal date
};

export const UserPackage = mongoose.model("UserPackage", UserPackageSchema);
