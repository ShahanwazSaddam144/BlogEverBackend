import { NextResponse } from "next/server";
import User from "@/Database/auth";
import { redisGet, redisSet, redisDel } from "@/app/utils/redis";
import { verifyVerificationToken } from "@/app/utils/token";
import { connectToDb } from "@/app/utils/mongo";

export async function GET(req) {
  try {
    const providedToken = params?.verifyToken;

    if (!providedToken || typeof providedToken !== "string") {
      return NextResponse.json({ error: "verifyToken is required in the path" }, { status: 400 });
    }

    const payload = verifyVerificationToken(providedToken);
    if (!payload?.sub) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const userId = String(payload.sub);
    const redisKey = `verify:${userId}`;

    // Ensure DB connection
    await connectToDb();

    // 2) Try Redis first
    const tokenInRedis = await redisGet(redisKey);

    if (tokenInRedis) {
      if (tokenInRedis !== providedToken) {
        return NextResponse.json({ error: "Token mismatch" }, { status: 403 });
      }
    } else {
      // 3) Fallback to DB
      const user = await User.findById(userId).lean();
      if (!user || !user.verificationToken) {
        return NextResponse.json({ error: "Token not found" }, { status: 404 });
      }

      if (user.isVerified) {
        return NextResponse.json({ error: "User already verified" }, { status: 400 });
      }

      // DB token must match
      if (user.verificationToken !== providedToken) {
        return NextResponse.json({ error: "Token mismatch" }, { status: 403 });
      }

      if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
        return NextResponse.json({ error: "Token expired" }, { status: 400 });
      }

      // Warm Redis for future requests (non-blocking if fails)
      try {
        await redisSet(redisKey, user.verificationToken, 24 * 60 * 60);
      } catch (err) {
        console.warn("Failed to warm Redis:", err);
      }
    }

    // 4) Mark user as verified and clear token fields
    await User.findByIdAndUpdate(
      userId,
      { isVerified: true, verificationToken: null, verificationTokenExpires: null },
      { new: true }
    );

    // 5) Remove Redis key (best-effort)
    try {
      await redisDel(redisKey);
    } catch (redisErr) {
      console.warn("Failed to delete Redis key:", redisErr);
    }

    // Success response — change to redirect if you prefer a UX flow (e.g. redirect to /verified)
    return NextResponse.json({ success: true, message: "Account verified" }, { status: 200 });
  } catch (err) {
    console.error("Verification GET endpoint error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
