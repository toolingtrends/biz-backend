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
  /** Fail fast; long SMTP hangs cause nginx 504 on routes that await sendMail (e.g. send-otp). */
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 20_000,
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

function parseFrontendBases(): string[] {
  const raw =
    process.env.FRONTEND_URL?.trim() ||
    process.env.APP_PUBLIC_URL?.trim() ||
    "http://localhost:3000";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/$/, ""));
}

export function resolveFrontendBase(preferredOrigin?: string): string {
  const bases = parseFrontendBases();
  if (preferredOrigin) {
    const normalized = preferredOrigin.replace(/\/$/, "");
    if (bases.includes(normalized)) return normalized;
  }
  return bases[0] || "http://localhost:3000";
}

const FRONTEND_BASE = resolveFrontendBase();

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
    .map(
      (t) =>
        `<li style="margin: 8px 0; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">${String(
          t
        ).replace(/</g, "&lt;")}</li>`
    )
    .join("");

  await transporter.sendMail({
    from: `"BizTradeFairs" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `Your events were imported (${eventTitles.length})`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f1f5f9; padding: 24px;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #0ea5e9 100%); color: #ffffff; padding: 22px 24px;">
            <h2 style="margin: 0; font-size: 22px; line-height: 1.3;">Events Imported Successfully</h2>
            <p style="margin: 8px 0 0 0; opacity: 0.92; font-size: 14px;">Your listings are now available on BizTradeFairs.</p>
          </div>

          <div style="padding: 22px 24px;">
            <p style="margin: 0 0 12px 0; color: #0f172a;">Hello <strong>${firstName || "there"}</strong>,</p>
            <p style="margin: 0 0 14px 0; color: #334155; line-height: 1.6;">
              The following event(s) have been added to the platform on your behalf:
            </p>
            <ul style="padding: 0; margin: 0 0 18px 0; list-style: none;">${listHtml}</ul>
        ${
          setPasswordUrl
            ? `<p style="margin: 24px 0;">
          <a href="${setPasswordUrl}" style="background: #2563eb; color: #fff; padding: 12px 22px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Set your password</a>
        </p>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">Your organizer account was created during import. Use the button above to choose a password and sign in with <strong>${toEmail}</strong>.</p>
        <p style="font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 10px;">${setPasswordUrl}</p>`
            : `<p style="margin: 8px 0 0 0; color: #475569;">You can sign in with this email address to manage your events.</p>`
        }
            <p style="margin: 22px 0 0 0; color: #334155;">Best regards,<br/><strong>The BizTradeFairs Team</strong></p>
          </div>
        </div>
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
    .map(
      (t) =>
        `<li style="margin: 8px 0; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">${String(
          t
        ).replace(/</g, "&lt;")}</li>`
    )
    .join("");

  await transporter.sendMail({
    from: `"BizTradeFairs" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `Event listing update (${eventTitles.length})`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f1f5f9; padding: 24px;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #0ea5e9 100%); color: #ffffff; padding: 22px 24px;">
            <h2 style="margin: 0; font-size: 22px; line-height: 1.3;">Event Listing Update</h2>
            <p style="margin: 8px 0 0 0; opacity: 0.92; font-size: 14px;">Your event details were processed successfully.</p>
          </div>

          <div style="padding: 22px 24px;">
            <p style="margin: 0 0 12px 0; color: #0f172a;">Hello <strong>${firstName || "there"}</strong>,</p>
            <p style="margin: 0 0 14px 0; color: #334155; line-height: 1.6;">
              Your event listing has been processed. Events:
            </p>
            <ul style="padding: 0; margin: 0 0 18px 0; list-style: none;">${listHtml}</ul>
        ${
          setPasswordUrl
            ? `<p style="margin: 24px 0;">
          <a href="${setPasswordUrl}" style="background: #2563eb; color: #fff; padding: 12px 22px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Set password</a>
        </p>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">Use this email <strong>${toEmail}</strong> to sign in after setting your password.</p>`
            : ""
        }
            <p style="margin: 22px 0 0 0; color: #334155;">Best regards,<br/><strong>The BizTradeFairs Team</strong></p>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendUserAccountAccessEmail(params: {
  toEmail: string;
  firstName: string;
  roleLabel: "Organizer" | "Venue Manager";
  setPasswordUrl?: string;
}): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  const { toEmail, firstName, roleLabel, setPasswordUrl } = params;

  await transporter.sendMail({
    from: `"BizTradeFairs" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `${roleLabel} account access details`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background: #f1f5f9; padding: 24px;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #0ea5e9 100%); color: #ffffff; padding: 22px 24px;">
            <h2 style="margin: 0; font-size: 22px; line-height: 1.3;">${roleLabel} Account Update</h2>
            <p style="margin: 8px 0 0 0; opacity: 0.92; font-size: 14px;">Your account details are ready on BizTradeFairs.</p>
          </div>
          <div style="padding: 22px 24px;">
            <p style="margin: 0 0 12px 0; color: #0f172a;">Hello <strong>${firstName || "there"}</strong>,</p>
            <p style="margin: 0 0 14px 0; color: #334155; line-height: 1.6;">
              Your <strong>${roleLabel}</strong> account is available with this email: <strong>${toEmail}</strong>.
            </p>
            ${
              setPasswordUrl
                ? `<p style="margin: 20px 0;">
                    <a href="${setPasswordUrl}" style="background: #2563eb; color: #fff; padding: 12px 22px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Verify Email & Set Password</a>
                  </p>
                  <p style="font-size: 13px; color: #475569; line-height: 1.6;">
                    Please verify your email and set a password to sign in.
                  </p>
                  <p style="font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 10px;">${setPasswordUrl}</p>`
                : `<p style="margin: 8px 0 0 0; color: #475569;">You can sign in directly using your existing password.</p>`
            }
            <p style="margin: 22px 0 0 0; color: #334155;">Best regards,<br/><strong>The BizTradeFairs Team</strong></p>
          </div>
        </div>
      </div>
    `,
  });
}

