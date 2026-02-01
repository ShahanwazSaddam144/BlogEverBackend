// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDb } from "@/app/utils/mongo";
import User from "@/Database/auth";
import Profile from "@/Database/profile";
import { generateVerificationToken } from "@/app/utils/token";
import { redisSet } from "@/app/utils/redis";
import { sendVerificationEmail } from "@/app/utils/mailer";
import validator from "validator";

export async function POST(req) {
  await connectToDb();
  try {
   let body = {};
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Please fill all fields" },
        { status: 400 },
      );
    }

    if (!validator.isEmail(email)) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }

    if (typeof name !== "string")
      return NextResponse.json({ message: "Invalid name" }, { status: 400 });

    if (typeof password !== "string")
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 400 },
      );
    if (password.length < 8)
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 },
      );
    if (password.length > 25)
      return NextResponse.json(
        { message: "Password must be less than 25 characters" },
        { status: 400 },
      );
    const existing = await User.findOne({ email });
    if (existing)
      return NextResponse.json({ message: "User already exists" }, {status:400});
    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
      isVerified: false,
      tokenVersion: 0,
    });
    const newProfile = new Profile({
      name,
      email,
      desc: "",
      age: false,
      role: "",
    });
    await newProfile.save();
    await newUser.save();
    const token = generateVerificationToken(newUser._id.toString());

    newUser.verificationToken = token;
    newUser.verificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    await newUser.save();

    const redisKey = `verify:${newUser._id.toString()}`;
    await redisSet(redisKey, token, 24 * 60 * 60);

    const origin = process.env.NEXT_PUBLIC_BASE_URL;
    if (!origin) {
      throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
    }
    await sendVerificationEmail(email, name, token);
    return NextResponse.json(
      {
        success: true,
        message:
          "Account created! Please check your email to verify your account.",
        token,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Signup Error:", err);
    return NextResponse.json({ message: "Server error" }, {status:500});
  }
}
