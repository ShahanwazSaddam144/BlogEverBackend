// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "@/app/utils/token";
import { connectToDb } from "@/app/utils/mongo";
import User from "@/Database/auth";
export async function POST(req) {
  await connectToDb();

  try {
    let body = {};
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { email, password } = body;
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { message: "Please fill all fields" },
        { status: 400 },
      );
    }
    const user = await User.findOne({ email }).lean();
    if (!user) return json({ message: "User not found" }, 404);
    if (!user?.isVerified)
      return NextResponse.json(
        { message: "Please verify your email before logging in" },
        { status: 401 },
      );

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ message: "Invalid email or password" }, {status:401});

    const authToken = generateToken(user,"AUTH","1h");
    const refreshToken = generateToken(user,"REFRESH","7d");

    return NextResponse.json(
      {
        success: true,
        user: {
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
        },
        authToken,
        refreshToken
      },
      {status:200},
    );
  } catch (err) {
    console.error("Login Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
