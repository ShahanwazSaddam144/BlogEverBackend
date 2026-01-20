// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDb } from "@/app/utils/mongo";
import User from "@/Database/auth";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Please set JWT_SECRET in env");

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

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

export async function POST(req) {
  await connectToDb();

  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return json({ message: "Please fill all fields" }, 400);
    }

    const existing = await User.findOne({ email });
    if (existing) return json({ message: "User already exists" }, 400);

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashed,
      isVerified: false,
      tokens: [],
    });

    await newUser.save();

    const verifyToken = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: "1d" });
    newUser.verifyToken = verifyToken;
    await newUser.save();

    const origin = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verifyUrl = `${origin}/api/auth/verify/${verifyToken}`;

    // send email if mailer exists, otherwise log the link
    // sendVerificationEmailSafe(newUser.email, newUser.name, verifyUrl).catch((err) =>
    //   console.log("Email not sent:", err)
    // );

    return json({ success: true, message: "Account created! Please check your email to verify your account." }, 201);
  } catch (err) {
    console.error("Signup Error:", err);
    return json({ message: "Server error" }, 500);
  }
}
