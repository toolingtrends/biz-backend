"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = sendOtpEmail;
exports.sendBadgeEmail = sendBadgeEmail;
exports.sendVerificationEmail = sendVerificationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
if (!EMAIL_USER || !EMAIL_PASS) {
    // Fail fast in non-test environments if credentials are missing
    if (process.env.NODE_ENV !== "test") {
        // eslint-disable-next-line no-console
        console.warn("[email.service] EMAIL_USER or EMAIL_PASS not set. Email sending will fail until configured.");
    }
}
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    secure: true,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});
async function sendOtpEmail(email, otp) {
    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error("Email credentials are not configured");
    }
    await transporter.sendMail({
        from: `"BizTradeFairs" <${EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Verification Code",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2563eb;">BizTradeFairs Email Verification</h2>
        <p>Hello,</p>
        <p>Your OTP code for email verification is:</p>
        <div style="background: #f3f4f6; padding: 16px; text-align: center; margin: 20px 0;">
          <h1 style="font-size: 32px; color: #2563eb; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <br/>
        <p>Best regards,<br/>The BizTradeFairs Team</p>
      </div>
    `,
    });
}
async function sendBadgeEmail(email, badgeDataUrl, attendeeName, eventName) {
    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error("Email credentials are not configured");
    }
    const base64Data = badgeDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    await transporter.sendMail({
        from: EMAIL_USER,
        to: email,
        subject: `Your Event Badge - ${eventName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${attendeeName},</h2>
        <p>Your event badge for <strong>${eventName}</strong> is ready!</p>
        <p>Please find your badge attached to this email. You can print it or save it to your mobile device.</p>
        <p>We look forward to seeing you at the event!</p>
        <br>
        <p>Best regards,<br>The Event Team</p>
      </div>
    `,
        attachments: [
            {
                filename: `badge-${attendeeName.replace(/\s+/g, "-")}.png`,
                content: buffer,
                contentType: "image/png",
            },
        ],
    });
}
async function sendVerificationEmail(email, otp) {
    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error("Email credentials are not configured");
    }
    await transporter.sendMail({
        from: `"BizTradeFairs" <${EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Verification Code",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2563eb;">BizTradeFairs Email Verification</h2>
        <p>Hello,</p>
        <p>Your OTP code for email verification is:</p>
        <div style="background: #f3f4f6; padding: 16px; text-align: center; margin: 20px 0;">
          <h1 style="font-size: 32px; color: #2563eb; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <br/>
        <p>Best regards,<br/>The BizTradeFairs Team</p>
      </div>
    `,
    });
}
