import jwt from "jsonwebtoken";

/* =========================
   ENV VARIABLES
========================= */

const {
  APP_SECRET,
  REFRESH_TOKEN,
  SID,
  PRIVATE_KEY,
  PUBLIC_KEY,
} = process.env;

if (!APP_SECRET) throw new Error("APP_SECRET is missing in env");
if (!REFRESH_TOKEN) throw new Error("REFRESH_TOKEN is missing in env");
if (!SID) throw new Error("SID is missing in env");
if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY is missing in env");
if (!PUBLIC_KEY) throw new Error("PUBLIC_KEY is missing in env");

const privateKey = PRIVATE_KEY.replace(/\\n/g, "\n");
const publicKey = PUBLIC_KEY.replace(/\\n/g, "\n");

/* =========================
   TOKEN SECRET SELECTOR
========================= */

function selectSecret(tokenType = "APP") {
  switch (tokenType) {
    case "APP":
      return APP_SECRET;
    case "REFRESH":
      return REFRESH_TOKEN;
    case "SID":
      return SID;
    default:
      return APP_SECRET;
  }
}

/* =========================
   ACCESS / REFRESH TOKENS
========================= */

export function generateToken(payload, type = "APP", expiresIn = "1h") {
  if (!payload) throw new Error("Payload is required");

  const secret = selectSecret(type);
  if (!secret) throw new Error("Invalid token type");

  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token, type = "APP") {
  if (!token) return null;

  try {
    const secret = selectSecret(type);
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

/* =========================
   EMAIL VERIFICATION TOKENS (RSA)
========================= */

export function generateVerificationToken(userId) {
  if (typeof userId !== "string") {
    throw new Error("userId must be a string");
  }

  return jwt.sign(
    {
      sub: userId,
      type: "account_verification",
    },
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: "1d",
    }
  );
}

export function verifyVerificationToken(token) {
  if (!token) return null;

  try {
    return jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    });
  } catch {
    return null;
  }
}
