import { Router } from "express";
import prisma from "../config/prisma";
import { sendOtpEmail } from "../services/email.service";
import { AuthService } from "../services/auth.service";

const router = Router();

// POST /api/auth/login – email/password → JWT (user, super-admin, sub-admin)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const result = await AuthService.authenticateWithCredentials(email, password);
    if (!result) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    return res.json({
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Login error (backend):", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

// POST /api/auth/refresh – refreshToken → new access + refresh tokens
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken is required" });
    }
    const tokens = await AuthService.refreshTokens(refreshToken);
    return res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Refresh token error (backend):", err);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user already exists (same behavior as Next.js route)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        alreadyRegistered: true,
        message: "Email already registered. Please login.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.deleteMany({ where: { email: normalizedEmail } });
    await prisma.otp.create({
      data: { email: normalizedEmail, otp, expiresAt },
    });

    // Send OTP email via centralized email service
    await sendOtpEmail(normalizedEmail, otp);

    return res.json({ message: "OTP sent successfully" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Send OTP error (backend):", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body as { email?: string; otp?: string };

    if (!email || !otp) {
      return res.status(400).json({ message: "Email & OTP are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const record = await prisma.otp.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await prisma.otp.deleteMany({ where: { email: normalizedEmail } });

    return res.json({ message: "OTP verified successfully" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Verify OTP error (backend):", err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
});

export default router;

