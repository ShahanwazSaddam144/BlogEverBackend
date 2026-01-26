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

/**
 * Improved verification HTML template
 * - Includes a hidden preheader (preview text)
 * - Uses table-based button for better client compatibility
 * - All styles inline to reduce Gmail/Outlook stripping issues
 */
export function verificationTemplate(name, token) {
  const safeName = escapeHtml(name || "there");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  const verificationLink = `${baseUrl.replace(/\/$/, "")}/api/auth/verify/${encodeURIComponent(
    token,
  )}`;

  const preheader = `${APP_NAME}: Verify your account — link valid for 24 hours.`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
    <!-- Preheader: hidden preview text -->
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(preheader)}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(16,24,40,0.05);">
            <tr>
              <td style="padding:28px 32px 0 32px;text-align:left;">
                <h1 style="margin:0;font-size:20px;color:#0f172a;">${escapeHtml(APP_NAME)}</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 32px 0 32px;">
                <p style="margin:0;color:#334155;font-size:15px;">Hi ${safeName},</p>
                <p style="color:#475569;font-size:15px;line-height:1.5;margin:12px 0 0;">
                  Thanks for signing up. Please verify your email address to activate your account. The verification link below will expire in 24 hours.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 32px 8px 32px;" align="center">
                <!-- button: use table for compatibility -->
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#2563eb" style="border-radius:8px;">
                      <a
                        href="${verificationLink}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="display:inline-block;padding:12px 22px;font-size:15px;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;"
                      >
                        Verify my account
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 32px 20px 32px;">
                <p style="margin:0;color:#64748b;font-size:13px;line-height:1.4;">
                  Alternatively, paste this link into your browser:
                </p>
                <p style="margin:8px 0 0;word-break:break-all;">
                  <a href="${verificationLink}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-size:13px;">${verificationLink}</a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 24px 32px;">
                <hr style="border:none;border-top:1px solid #eef2f7;margin:0 0 16px;" />
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  If you did not create an account with ${escapeHtml(APP_NAME)}, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 32px 28px 32px;background:#fafafa;color:#64748b;font-size:12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="font-weight:600;color:#0f172a;">${escapeHtml(APP_NAME)}</div>
                  <div style="margin-left:auto;">&copy; ${new Date().getFullYear()}</div>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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

/**
 * Small polish for welcome template to match the verification style
 */
export function welcomeTemplate(name) {
  const safeName = escapeHtml(name || "friend");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;">
                <h1 style="margin:0;font-size:20px;color:#0f172a;">Welcome to ${escapeHtml(APP_NAME)} 🎉</h1>
                <p style="color:#475569;margin:12px 0 0;font-size:15px;">Hi ${safeName},</p>
                <p style="color:#475569;font-size:15px;line-height:1.5;">Your account is now verified. Get started by visiting the link below.</p>
                <p style="margin:18px 0 0;">
                  <a href="${APP_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 18px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Go to ${escapeHtml(APP_NAME)}</a>
                </p>
                <hr style="border:none;border-top:1px solid #eef2f7;margin:20px 0;" />
                <p style="color:#94a3b8;font-size:12px;margin:0;">Need help? Reply to this email and we'll assist.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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
