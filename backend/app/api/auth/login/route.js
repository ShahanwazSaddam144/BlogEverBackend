// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDb } from "@/app/utils/mongo";
import User from "@/Database/auth";

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req) {
  await connectToDb();

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) return json({ message: "Please fill all fields" }, 400);

    const user = await User.findOne({ email });
    if (!user) return json({ message: "User not found" }, 404);
    if (!user.isVerified) return json({ message: "Please verify your email before logging in" }, 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return json({ message: "Invalid email or password" }, 401);

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    user.tokens.push({ token });
    await user.save();

    return json(
      {
        success: true,
        user: { name: user.name, email: user.email, isVerified: user.isVerified },
        token,
      },
      200
    );
  } catch (err) {
    console.error("Login Error:", err);
    return json({ message: "Server error" }, 500);
  }
}
