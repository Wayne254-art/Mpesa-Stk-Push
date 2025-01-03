
import cron from "node-cron"
import { UserPackage } from "../models/package.model.js"

// Schedule the cron job to run every day at midnight
cron.schedule("0 0 * * *", async () => {
    console.log("Running package renewal job...");

    try {
        // Find active packages that have expired
        const expiredPackages = await UserPackage.find({
            status: "active",
            renewalDate: { $lte: new Date() },
        });

        for (let userPackage of expiredPackages) {
            console.log(`Renewing package for user: ${userPackage.userId}`);

            // Renew the package
            userPackage.renew();
            await userPackage.save();
        }

        console.log("Package renewal job completed.");
    } catch (error) {
        console.error("Error during package renewal job:", error);
    }
});
