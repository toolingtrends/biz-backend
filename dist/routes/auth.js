"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const prisma_1 = __importDefault(require("../config/prisma"));
const otp_model_1 = require("../modules/otp.model");
const email_service_1 = require("../services/email.service");
const router = (0, express_1.Router)();
// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        // 1. Check if user already exists (same behavior as Next.js route)
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            return res.status(409).json({
                alreadyRegistered: true,
                message: "Email already registered. Please login.",
            });
        }
        // 2. Connect to MongoDB for OTP storage
        await (0, db_1.default)();
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        // Remove any existing OTPs for this email
        await otp_model_1.OtpModel.deleteMany({ email: normalizedEmail });
        // Store new OTP
        await otp_model_1.OtpModel.create({ email: normalizedEmail, otp, expiresAt });
        // Send OTP email via centralized email service
        await (0, email_service_1.sendOtpEmail)(normalizedEmail, otp);
        return res.json({ message: "OTP sent successfully" });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Send OTP error (backend):", err);
        return res.status(500).json({ message: "Failed to send OTP" });
    }
});
// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email & OTP are required" });
        }
        await (0, db_1.default)();
        const normalizedEmail = email.trim().toLowerCase();
        const record = await otp_model_1.OtpModel.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
        if (!record) {
            return res.status(400).json({ message: "OTP not found" });
        }
        if (record.expiresAt < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }
        if (record.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        await otp_model_1.OtpModel.deleteMany({ email: normalizedEmail });
        return res.json({ message: "OTP verified successfully" });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Verify OTP error (backend):", err);
        return res.status(500).json({ message: "Failed to verify OTP" });
    }
});
exports.default = router;
