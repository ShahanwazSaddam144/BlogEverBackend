// lib/mailer.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  FROM_EMAIL,
  APP_NAME = "MyApp",
  APP_URL,
} = process.env;

if (
  !SMTP_HOST ||
  !SMTP_PORT ||
  !SMTP_USER ||
  !SMTP_PASS ||
  !FROM_EMAIL ||
  !APP_URL
) {
  throw new Error(
    "Missing mailer env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, APP_URL",
  );
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxRetries: 2,
  });

  transporter.verify().catch((err) => {
    console.warn(
      "Mail transporter verify failed:",
      err && err.message ? err.message : err,
    );
  });

  return transporter;
}

function escapeHtml(value) {
  const str = String(value || "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function verificationTemplate(name, token) {
  const safeName = escapeHtml(name || "there");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if(!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  const verificationLink = `${baseUrl}/api/auth/verify/${encodeURIComponent(token)}`;

  const html = `
    <html>
      <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial; color:#111;">
        <div style="max-width:680px;margin:0 auto;padding:24px;">
          <h2 style="margin-bottom:0.5rem">${APP_NAME} — Verify your account ✅</h2>
          <p style="color:#555">Hi ${safeName},</p>
          <p style="color:#555">
            Click the button below to verify your account. This link is valid for 24 hours.
          </p>

          <div style="margin:24px 0;">
            <a href="${verificationLink}"
               style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">
              Verify my account
            </a>
          </div>

          <p style="color:#777;font-size:13px;">
            Or paste this URL into your browser:<br/>
            <a href="${verificationLink}" style="color:#2563eb;word-break:anywhere;">${verificationLink}</a>
          </p>

          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />

          <p style="color:#999;font-size:12px">
            If you didn't sign up for ${APP_NAME}, ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${name || "there"},

Verify your account by visiting the link below (valid 24 hours):
${verificationLink}

If you didn't sign up, ignore this message.

- ${APP_NAME}`;

  return {
    subject: `${APP_NAME} — Verify your account`,
    html,
    text,
  };
}

export function welcomeTemplate(name) {
  const safeName = escapeHtml(name || "friend");
  const html = `
    <html>
      <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial; color:#111;">
        <div style="max-width:680px;margin:0 auto;padding:24px;">
          <h2 style="margin-bottom:0.5rem">Welcome to ${APP_NAME} 🎉</h2>
          <p style="color:#555">Hi ${safeName},</p>
          <p style="color:#555">
            Your account has been verified. We're happy to have you on board.
          </p>

          <p style="color:#555">
            Get started at <a href="${APP_URL}" style="color:#2563eb;">${APP_URL}</a>
          </p>

          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />

          <p style="color:#999;font-size:12px">
            Need help? Reply to this email and we'll assist.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${name || "friend"},

Your account has been verified. Visit ${APP_URL} to get started.

- ${APP_NAME}`;

  return {
    subject: `Welcome to ${APP_NAME}!`,
    html,
    text,
  };
}

export async function sendMail(to, subject, html, text) {
  if (
    typeof to !== "string" ||
    typeof subject !== "string" ||
    typeof html !== "string"
  ) {
    throw new Error(
      "sendMail expects (to: string, subject: string, html: string, text?: string)",
    );
  }

  const mailTransporter = getTransporter();
  const sendResult = await mailTransporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
  });

  return sendResult;
}

export async function sendVerificationEmail(to, name, token) {
  if (
    typeof to !== "string" ||
    typeof name !== "string" ||
    typeof token !== "string"
  ) {
    throw new Error("sendVerificationEmail expects (to, name, token) strings");
  }

  const template = verificationTemplate(name, token);
  return sendMail(to, template.subject, template.html, template.text);
}

export async function sendWelcomeEmail(to, name) {
  if (typeof to !== "string" || typeof name !== "string") {
    throw new Error("sendWelcomeEmail expects (to, name) strings");
  }

  const template = welcomeTemplate(name);
  return sendMail(to, template.subject, template.html, template.text);
}

export default {
  sendMail,
  sendVerificationEmail,
  sendWelcomeEmail,
  verificationTemplate,
  welcomeTemplate,
};
