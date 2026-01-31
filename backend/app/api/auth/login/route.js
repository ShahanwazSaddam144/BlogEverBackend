import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "@/app/utils/token";
import { connectToDb } from "@/app/utils/mongo";
import User from "@/Database/auth";
import validator from "validator";

export async function POST(req) {
  await connectToDb();

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // 1️⃣ Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: "Please fill all fields" },
        { status: 400 }
      );
    }

    if (!validator.isEmail(email)) {
      return NextResponse.json(
        { message: "Invalid email" },
        { status: 400 }
      );
    }

    // 2️⃣ Database Lookup
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 3️⃣ Email Verification
    if (!user.isVerified) {
      return NextResponse.json(
        { message: "Please verify your email" },
        { status: 401 }
      );
    }

    // 4️⃣ Password Check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 5️⃣ Token Generation (SAFE PAYLOAD)
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
    };

    const accessToken = generateToken(tokenPayload, "AUTH", "1h");
    const refreshToken = generateToken(tokenPayload, "REFRESH", "7d");

    // 6️⃣ RESPONSE (React Native Compatible)
    return NextResponse.json(
      {
        success: true,
        user: {
          name: user.name,
          email: user.email,
        },
        accessToken,
        refreshToken, // 🔥 REQUIRED for React Native
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login Error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
