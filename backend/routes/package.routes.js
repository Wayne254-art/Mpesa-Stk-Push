
import express from 'express';
const router = express.Router();
import {activatePackage, getUserPackage} from '../controllers/package.controllers.js';

// Activate a package
router.post("/activate", activatePackage);

// Get user's package
router.get("/user/:userId", getUserPackage);

export default router
