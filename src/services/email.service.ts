import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  // Fail fast in non-test environments if credentials are missing
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.warn(
      "[email.service] EMAIL_USER or EMAIL_PASS not set. Email sending will fail until configured."
    );
  }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
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

export async function sendBadgeEmail(
  email: string,
  badgeDataUrl: string,
  attendeeName: string,
  eventName: string
): Promise<void> {
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

export async function sendVerificationEmail(email: string, otp: string): Promise<void> {
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

const FRONTEND_BASE =
  process.env.FRONTEND_URL || process.env.APP_PUBLIC_URL || "http://localhost:3000";

export async function sendPasswordResetLinkEmail(params: {
  toEmail: string;
  resetUrl: string;
  firstName: string;
  roleLabel: string;
}): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  const { toEmail, resetUrl, firstName, roleLabel } = params;

  await transporter.sendMail({
    from: `"BizTradeFairs" <${EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2563eb;">Password reset</h2>
        <p>Hello ${firstName || "there"},</p>
        <p>We received a request to reset the password for your <strong>${roleLabel}</strong> account.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset password</a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
        <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${resetUrl}</p>
        <p>Best regards,<br/>The BizTradeFairs Team</p>
      </div>
    `,
  });
}

/** OTP for super-admin / sub-admin password reset — sent to their login email. */
export async function sendAdminPasswordResetOtpEmail(params: {
  toEmail: string;
  otp: string;
  name: string;
  adminKind: "Super Admin" | "Sub Admin";
}): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  const { toEmail, otp, name, adminKind } = params;

  await transporter.sendMail({
    from: `"BizTradeFairs" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `Your ${adminKind} password reset code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2563eb;">Admin password reset</h2>
        <p>Hello ${name || "there"},</p>
        <p>Use this one-time code to set a new password for your <strong>${adminKind}</strong> account:</p>
        <div style="background: #f3f4f6; padding: 16px; text-align: center; margin: 20px 0;">
          <h1 style="font-size: 32px; color: #2563eb; margin: 0; letter-spacing: 4px;">${otp}</h1>
        </div>
        <p>This code expires in <strong>15 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br/>
        <p>Best regards,<br/>The BizTradeFairs Team</p>
      </div>
    `,
  });
}

export { FRONTEND_BASE };

/** Sent after bulk event import finishes — one email per organizer with event titles. */
export async function sendEventImportThankYouEmail(params: {
  toEmail: string;
  firstName: string;
  eventTitles: string[];
  setPasswordUrl?: string;
}): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  const { toEmail, firstName, eventTitles, setPasswordUrl } = params;
  const listHtml = eventTitles
    .map((t) => `<li style="margin:6px 0;">${String(t).replace(/</g, "&lt;")}</li>`)
    .join("");

  await transporter.sendMail({
    from: `"BizTradeFairs" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `Your events were imported (${eventTitles.length})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2563eb;">Thank you</h2>
        <p>Hello ${firstName || "there"},</p>
        <p>The following event(s) have been added to the platform on your behalf:</p>
        <ul style="padding-left: 20px;">${listHtml}</ul>
        ${
          setPasswordUrl
            ? `<p style="margin: 24px 0;">
          <a href="${setPasswordUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set your password</a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">Your organizer account was created during import. Use the button above to choose a password and sign in with <strong>${toEmail}</strong>.</p>
        <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${setPasswordUrl}</p>`
            : `<p>You can sign in with this email address to manage your events.</p>`
        }
        <p>Best regards,<br/>The BizTradeFairs Team</p>
      </div>
    `,
  });
}

export async function sendMarketingEmail(params: {
  to: string;
  subject: string;
  content: string;
  htmlContent?: string;
}): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  await transporter.sendMail({
    from: `"BizTradeFairs" <${EMAIL_USER}>`,
    to: params.to,
    subject: params.subject,
    text: params.content,
    html:
      params.htmlContent ||
      `<div style="font-family: Arial, sans-serif; line-height: 1.6; white-space: pre-wrap;">${params.content}</div>`,
  });
}

export async function sendEventListingThankYouEmail(params: {
  toEmail: string;
  firstName: string;
  eventTitles: string[];
  setPasswordUrl?: string;
}): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  const { toEmail, firstName, eventTitles, setPasswordUrl } = params;
  const listHtml = eventTitles
    .map((t) => `<li style="margin:6px 0;">${String(t).replace(/</g, "&lt;")}</li>`)
    .join("");

  await transporter.sendMail({
    from: `"BizTradeFairs" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `Event listing update (${eventTitles.length})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2563eb;">Thank you</h2>
        <p>Hello ${firstName || "there"},</p>
        <p>Your event listing has been processed. Events:</p>
        <ul style="padding-left: 20px;">${listHtml}</ul>
        ${
          setPasswordUrl
            ? `<p style="margin: 24px 0;">
          <a href="${setPasswordUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set password</a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">Use this email <strong>${toEmail}</strong> to sign in after setting your password.</p>`
            : ""
        }
        <p>Best regards,<br/>The BizTradeFairs Team</p>
      </div>
    `,
  });
}

