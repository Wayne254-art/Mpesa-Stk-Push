
import { UserPackage } from '../models/package.model.js';

// Activate Package After Successful Payment
export const activatePackage = async (req, res) => {
    try {
        const { userId, packageType, paymentReference } = req.body;

        // Validate packageType
        const validPackages = ["Free", "Silver", "Gold", "Diamond"];
        if (!validPackages.includes(packageType)) {
            return res.status(400).json({ message: "Invalid package type." });
        }

        // Upsert (update or create) user's package
        const userPackage = await UserPackage.findOneAndUpdate(
            { userId }, // Find by userId
            {
                userId,
                packageType,
                status: "active",
                paymentReference,
                startDate: new Date(),
                renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({
            message: "Package activated successfully.",
            data: userPackage,
        });
    } catch (error) {
        console.error("Error activating package:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// Get User's Package Details
export const getUserPackage = async (req, res) => {
    try {
        const { userId } = req.params;

        const userPackage = await UserPackage.findOne({ userId });

        if (!userPackage) {
            return res.status(404).json({ message: "No package found for this user." });
        }

        return res.status(200).json({
            message: "User package fetched successfully.",
            data: userPackage,
        });
    } catch (error) {
        console.error("Error fetching package:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
