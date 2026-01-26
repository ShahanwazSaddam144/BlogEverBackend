// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDb } from "@/app/utils/mongo";
import User from "@/Database/auth";
export async function POST(req) {
  await connectToDb();

  try {
    const body = await req.json();
    const { email, password } = body;
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ message: "Please fill all fields" }, {status:400});
    }
    const user = await User.findOne({ email });
    if (!user) return json({ message: "User not found" }, 404);
    if (!user?.isVerified)
      return NextResponse.json(
        { message: "Please verify your email before logging in" },
        {status:401},
      );

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ message: "Invalid email or password" }, {status:401});

    const token = jwt.sign(
      { id: user._id, email: user.email },
      { expiresIn: "7d" },
    );
    user.tokens.push({ token });
    await user.save();

    return NextResponse.json(
      {
        success: true,
        user: {
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
        },
        token,
      },
      {status:200},
    );
  } catch (err) {
    console.error("Login Error:", err);
    return NextResponse.json({ message: "Server error" }, {status:500});
  }
}
