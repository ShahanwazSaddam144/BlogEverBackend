// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDb } from "@/app/utils/mongo";
import User from "@/Database/auth";
import { generateVerificationToken } from "@/app/utils/token";
import { redisSet } from "@/app/utils/redis";
// async function sendVerificationEmailSafe(to, name, url) {
//   try {
//     // route is at app/api/auth/register/route.js -> middleware likely at /middleware/mailer.js
//     const mod = await import("../../../../middleware/mailer").catch(() => null);
//     if (mod?.sendVerificationEmail) {
//       return mod.sendVerificationEmail(to, name, url);
//     }
//   } catch (e) {
//     /* ignore */
//   }
//   // fallback: log the link for dev
//   console.log("No mailer configured — verification URL:", url);
//   return Promise.resolve();
// }

const emailNameRegex = /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*$/;

function validateEmailName(name) {
  if (typeof name !== "string") throw new Error("name must be a string");
  return emailNameRegex.test(name);
}

export async function POST(req) {
  await connectToDb();
  try {
    const body = await req.NextResponse.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Please fill all fields" },
        { status: 400 },
      );
    }
    if (!validateEmailName(email)) {
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
      return NextResponse.json({ message: "User already exists" }, 400);
    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
      isVerified: false,
      tokenVersion: 0,
    });

    // 2️⃣ Generate verification JWT
    const token = generateVerificationToken(newUser._id.toString());

    // 3️⃣ Set token and expiration in MongoDB
    newUser.verificationToken = token;
    newUser.verificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ); // 1 day

    await newUser.save();

    // 4️⃣ Store token in Redis with TTL of 1 day (86400 seconds)
    const redisKey = `verify:${newUser._id.toString()}`;
    await redisSet(redisKey, token, 24 * 60 * 60);

    const origin = process.env.NEXT_PUBLIC_BASE_URL;
    if (!origin) {
      throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
    }
    const verifyUrl = `${origin}/api/auth/verify/${verifyToken}`;
    return NextResponse.json(
      {
        success: true,
        message:
          "Account created! Please check your email to verify your account.",
        publicToken,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Signup Error:", err);
    return NextResponse.json({ message: "Server error" }, 500);
  }
}
