"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRONTEND_BASE = void 0;
exports.sendOtpEmail = sendOtpEmail;
exports.sendBadgeEmail = sendBadgeEmail;
exports.sendVerificationEmail = sendVerificationEmail;
exports.resolveFrontendBase = resolveFrontendBase;
exports.sendPasswordResetLinkEmail = sendPasswordResetLinkEmail;
exports.sendAdminPasswordResetOtpEmail = sendAdminPasswordResetOtpEmail;
exports.sendEventImportThankYouEmail = sendEventImportThankYouEmail;
exports.sendMarketingEmail = sendMarketingEmail;
exports.sendEventListingThankYouEmail = sendEventListingThankYouEmail;
exports.sendUserAccountAccessEmail = sendUserAccountAccessEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
/** Read at call time so `dotenv` / `load-env` runs before any import of this module. */
function getSendGridApiKey() {
    return (process.env.SENDGRID_API_KEY ?? "").trim();
}
function getEffectiveFromEmail() {
    const fromSg = process.env.SENDGRID_FROM_EMAIL?.trim();
    if (fromSg)
        return fromSg;
    const u = process.env.EMAIL_USER?.trim();
    return u || undefined;
}
function mailConfigured() {
    if (getSendGridApiKey())
        return !!getEffectiveFromEmail();
    return !!(process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS);
}
if (!mailConfigured() && process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.warn("[email.service] Set SENDGRID_API_KEY + SENDGRID_FROM_EMAIL (VPS), or EMAIL_USER + EMAIL_PASS (Gmail SMTP).");
}
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    secure: true,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
    /** Fail fast; long SMTP hangs cause nginx 504 on routes that await sendMail (e.g. send-otp). */
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
});
function parseFromHeader(from) {
    const m = from.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
    if (m) {
        const name = m[1].trim();
        return { email: m[2].trim(), ...(name ? { name } : {}) };
    }
    return { email: from.trim() };
}
function requireMailConfig() {
    if (getSendGridApiKey()) {
        if (!getEffectiveFromEmail()) {
            throw new Error("Set SENDGRID_FROM_EMAIL (verified sender in SendGrid) or EMAIL_USER when using SENDGRID_API_KEY.");
        }
        return;
    }
    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error("Email credentials are not configured");
    }
}
async function sendViaSendGrid(opts) {
    const fromParsed = parseFromHeader(opts.from);
    const fromEmail = getEffectiveFromEmail() || fromParsed.email || EMAIL_USER;
    if (!fromEmail) {
        throw new Error("Missing sender email for SendGrid.");
    }
    const content = [];
    if (opts.text) {
        content.push({ type: "text/plain", value: opts.text });
    }
    if (opts.html) {
        content.push({ type: "text/html", value: opts.html });
    }
    if (content.length === 0) {
        throw new Error("Email must include html or text content");
    }
    const body = {
        personalizations: [{ to: [{ email: opts.to }] }],
        from: {
            email: fromEmail,
            ...(fromParsed.name ? { name: fromParsed.name } : {}),
        },
        subject: opts.subject,
        content,
    };
    if (opts.attachments?.length) {
        body.attachments = opts.attachments.map((a) => ({
            content: a.content.toString("base64"),
            filename: a.filename,
            type: a.contentType || "application/octet-stream",
            disposition: "attachment",
        }));
    }
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${getSendGridApiKey()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
        const errText = await res.text();
        let summary = errText.slice(0, 800);
        try {
            const parsed = JSON.parse(errText);
            if (parsed.errors?.length) {
                summary = parsed.errors.map((e) => e.message).filter(Boolean).join("; ") || summary;
            }
        }
        catch {
            /* keep raw text */
        }
        // eslint-disable-next-line no-console
        console.error("[email.service] SendGrid HTTP", res.status, errText.slice(0, 2000));
        throw new Error(`SendGrid error ${res.status}: ${summary}`);
    }
}
async function dispatchMail(opts) {
    requireMailConfig();
    if (getSendGridApiKey()) {
        await sendViaSendGrid(opts);
        return;
    }
    await transporter.sendMail({
        from: opts.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        attachments: opts.attachments?.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType || "application/octet-stream",
        })),
    });
}
async function sendOtpEmail(email, otp) {
    await dispatchMail({
        from: `"BizTradeFairs" <${getEffectiveFromEmail()}>`,
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
    const base64Data = badgeDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    await dispatchMail({
        from: `"BizTradeFairs" <${getEffectiveFromEmail()}>`,
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
    await dispatchMail({
        from: `"BizTradeFairs" <${getEffectiveFromEmail()}>`,
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
function parseFrontendBases() {
    const raw = process.env.FRONTEND_URL?.trim() ||
        process.env.APP_PUBLIC_URL?.trim() ||
        "http://localhost:3000";
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/\/$/, ""));
}
function resolveFrontendBase(preferredOrigin) {
    const bases = parseFrontendBases();
    if (preferredOrigin) {
        const normalized = preferredOrigin.replace(/\/$/, "");
        if (bases.includes(normalized))
            return normalized;
    }
    return bases[0] || "http://localhost:3000";
}
const FRONTEND_BASE = resolveFrontendBase();
exports.FRONTEND_BASE = FRONTEND_BASE;
async function sendPasswordResetLinkEmail(params) {
    const { toEmail, resetUrl, firstName, roleLabel } = params;
    await dispatchMail({
        from: `"BizTradeFairs" <${getEffectiveFromEmail()}>`,
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
async function sendAdminPasswordResetOtpEmail(params) {
    const { toEmail, otp, name, adminKind } = params;
    await dispatchMail({
        from: `"BizTradeFairs" <${getEffectiveFromEmail()}>`,
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
/** Sent after bulk event import finishes — one email per organizer with event titles. */
async function sendEventImportThankYouEmail(params) {
    const { toEmail, firstName, eventTitles, setPasswordUrl } = params;
    const listHtml = eventTitles
        .map((t) => `<li style="margin: 8px 0; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">${String(t).replace(/</g, "&lt;")}</li>`)
        .join("");
    await dispatchMail({
        from: `"BizTradeFairs" <${getEffectiveFromEmail()}>`,
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
        ${setPasswordUrl
            ? `<p style="margin: 24px 0;">
          <a href="${setPasswordUrl}" style="background: #2563eb; color: #fff; padding: 12px 22px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Set your password</a>
        </p>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">Your organizer account was created during import. Use the button above to choose a password and sign in with <strong>${toEmail}</strong>.</p>
        <p style="font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 10px;">${setPasswordUrl}</p>`
            : `<p style="margin: 8px 0 0 0; color: #475569;">You can sign in with this email address to manage your events.</p>`}
            <p style="margin: 22px 0 0 0; color: #334155;">Best regards,<br/><strong>The BizTradeFairs Team</strong></p>
          </div>
        </div>
      </div>
    `,
    });
}
async function sendMarketingEmail(params) {
    const html = params.htmlContent ||
        `<div style="font-family: Arial, sans-serif; line-height: 1.6; white-space: pre-wrap;">${params.content}</div>`;
    await dispatchMail({
        from: `"BizTradeFairs" <${getEffectiveFromEmail()}>`,
        to: params.to,
        subject: params.subject,
        text: params.content,
        html,
    });
}
async function sendEventListingThankYouEmail(params) {
    const { toEmail, firstName, eventTitles, setPasswordUrl } = params;
    const listHtml = eventTitles
        .map((t) => `<li style="margin: 8px 0; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">${String(t).replace(/</g, "&lt;")}</li>`)
        .join("");
    await dispatchMail({
        from: `"BizTradeFairs" <${getEffectiveFromEmail()}>`,
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
        ${setPasswordUrl
            ? `<p style="margin: 24px 0;">
          <a href="${setPasswordUrl}" style="background: #2563eb; color: #fff; padding: 12px 22px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Set password</a>
        </p>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">Use this email <strong>${toEmail}</strong> to sign in after setting your password.</p>`
            : ""}
            <p style="margin: 22px 0 0 0; color: #334155;">Best regards,<br/><strong>The BizTradeFairs Team</strong></p>
          </div>
        </div>
      </div>
    `,
    });
}
async function sendUserAccountAccessEmail(params) {
    const { toEmail, firstName, roleLabel, setPasswordUrl } = params;
    await dispatchMail({
        from: `"BizTradeFairs" <${getEffectiveFromEmail()}>`,
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
            ${setPasswordUrl
            ? `<p style="margin: 20px 0;">
                    <a href="${setPasswordUrl}" style="background: #2563eb; color: #fff; padding: 12px 22px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Verify Email & Set Password</a>
                  </p>
                  <p style="font-size: 13px; color: #475569; line-height: 1.6;">
                    Please verify your email and set a password to sign in.
                  </p>
                  <p style="font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 10px;">${setPasswordUrl}</p>`
            : `<p style="margin: 8px 0 0 0; color: #475569;">You can sign in directly using your existing password.</p>`}
            <p style="margin: 22px 0 0 0; color: #334155;">Best regards,<br/><strong>The BizTradeFairs Team</strong></p>
          </div>
        </div>
      </div>
    `,
    });
}
