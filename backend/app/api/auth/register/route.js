import { NextResponse } from "next/server";
import { connectToDb } from "@/app/utils/mongo";
import User from "@/Database/auth";
import { verifyVerificationToken } from "@/app/utils/token";
import { redisGet, redisDel } from "@/app/utils/redis";

export async function GET(req) {
  await connectToDb();

  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Verification token missing" },
        { status: 400 }
      );
    }

    // 1️⃣ Verify JWT (RSA)
    const decoded = verifyVerificationToken(token);
    if (!decoded || decoded.type !== "account_verification") {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const userId = decoded.sub;

    // 2️⃣ Check Redis (extra security)
    const redisKey = `verify:${userId}`;
    const redisToken = await redisGet(redisKey);

    if (!redisToken || redisToken !== token) {
      return NextResponse.json(
        { message: "Token expired or already used" },
        { status: 400 }
      );
    }

    // 3️⃣ Find user in DB
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Already verified
    if (user.isVerified) {
      return NextResponse.json(
        { message: "Account already verified" },
        { status: 200 }
      );
    }

    // 5️⃣ Expiry check (MongoDB)
    if (
      !user.verificationTokenExpires ||
      user.verificationTokenExpires < new Date()
    ) {
      return NextResponse.json(
        { message: "Verification token expired" },
        { status: 400 }
      );
    }

    // 6️⃣ VERIFY USER (THIS IS WHY TOKEN BECOMES NULL)
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;

    await user.save();

    // 7️⃣ Cleanup Redis
    await redisDel(redisKey);

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully. You can now log in.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Verification Error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
