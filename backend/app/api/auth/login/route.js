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
        { status: 400 },
      );
    }

    const { email, password } = body;

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: "Please fill all fields" },
        { status: 400 },
      );
    }
    if (!validator.isEmail(email)) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }

    // 2. Database Lookup
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    // 3. Verification Check
    if (!user.isVerified) {
      return NextResponse.json(
        { message: "Please verify your email" },
        { status: 401 },
      );
    }

    // 4. Password Match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const payload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified, 
    };

    // Generate tokens using only this safe payload
    const accessToken = generateToken(payload, "APP", "1h");
    const refreshToken = generateToken(payload, "REFRESH", "7d");

    // 6. Create Response with HttpOnly Cookie
    const response = NextResponse.json(
      {
        success: true,
        user: { name: user.name, email: user.email },
        accessToken, 
      },
      { status: 200 },
    );

    // Set Refresh Token in a secure cookie
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
