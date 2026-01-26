import jwt from "jsonwebtoken";

const APP_SECRET = process.env.APP_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const SID = process.env.SID;

const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");
const publicKey = process.env.PUBLIC_KEY.replace(/\\n/g, "\n");

if (!APP_SECRET) throw new Error("Please set APP_SECRET in env");

function selectToken(type) {
  try {
    let type;
    switch (type) {
      case "APP":
        type = APP_SECRET;
        break;
      case "REFRESH":
        type = REFRESH_TOKEN;
        break;
      case "SID":
        type = SID;
        break;
      default:
        type = APP_SECRET;
        break;
    }
    return type;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export function verifyToken(token, type = "APP") {
  try {
    const secret = selectToken(type);
    if (!secret) {
      console.error("missing type");
      return false;
    }
    if (!token) {
      console.error("missing token");
      return false;
    }
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (err) {
    console.log(err);
    return false;
  }
}
export function generateToken(user, type = "APP", expiresIn = "1h") {
  try {
    const secret = selectToken(type);
    if (!secret) {
      console.error("missing type");
      return false;
    }
    if (!user) {
      console.error("missing user or user.uid");
      return false;
    }
    const token = jwt.sign({ user }, secret, { expiresIn });
    return token;
  } catch (err) {
    console.log(err);
    return false;
  }
}

if (!privateKey || !publicKey) {
  throw new Error(
    "JWT private/public keys are not defined in environment variables",
  );
}

export function generateVerificationToken(userId) {
  if (typeof userId !== "string") throw new Error("userId must be a string");
  return jwt.sign(
    {
      sub: userId,
      type: "account_verification",
    },
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: "1d",
    },
  );
}

export function verifyVerificationToken(token) {
  if (typeof token !== "string") throw new Error("token must be a string");
  try {
    return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
  } catch {
    return null;
  }
}
