
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import("./cron/renewable.packages.js");

import paymentRoutes from "./routes/payment.routes.js";
import packageRoutes from "./routes/package.routes.js";


dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

connectDB();

// Import routes
app.use('/api', paymentRoutes);

app.use("/api/packages", packageRoutes);

// Define the port with a fallback
const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Server Running on port ${port}`);
});
