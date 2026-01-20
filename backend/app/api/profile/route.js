// app/api/profile/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDb } from "@/app/utils/mongo";
import Profile from "@/Database/profile"; // keep this path if that's where your ESM model lives

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Please set JWT_SECRET in env");

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function getAuthToken(req) {
  const header = req.headers.get("authorization") || "";
  if (!header) return null;
  const parts = header.split(" ");
  return parts.length === 2 ? parts[1] : null;
}

// POST /profile -> create profile (auth)
export async function POST(req) {
  await connectToDb();
  const { pathname } = new URL(req.url);

  if (!pathname.endsWith("/profile")) return json({ message: "Not found" }, 404);

  try {
    const token = getAuthToken(req);
    if (!token) return json({ message: "No token provided" }, 401);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return json({ message: "Invalid token" }, 401);
    }

    const body = await req.json();
    const { desc, age, role } = body;
    if (!desc || age === undefined || !role) return json({ message: "Please fill all fields" }, 400);

    const existing = await Profile.findOne({ email: decoded.email });
    if (existing) return json({ message: "Profile already exists" }, 400);

    const profile = new Profile({ email: decoded.email, desc, age, role });
    await profile.save();

    return json({ message: "Profile created", profile }, 201);
  } catch (err) {
    console.error("Create profile error:", err);
    return json({ message: "Server error" }, 500);
  }
}

// GET handler -> either current user's profile or profile by email
export async function GET(req) {
  await connectToDb();
  const { pathname } = new URL(req.url);

  // GET /profile -> current user's profile (auth)
  if (pathname.endsWith("/profile")) {
    try {
      const token = getAuthToken(req);
      if (!token) return json({ message: "No token provided" }, 401);

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        return json({ message: "Invalid token" }, 401);
      }

      const profile = await Profile.findOne({ email: decoded.email });
      if (!profile) return json({ message: "Profile not found" }, 404);

      return json(profile, 200);
    } catch (err) {
      console.error("Get current profile error:", err);
      return json({ message: "Server error" }, 500);
    }
  }

  // GET /profile/:email -> by email (public)
  if (pathname.includes("/profile/")) {
    try {
      const parts = pathname.split("/");
      const email = decodeURIComponent(parts[parts.length - 1] || "");
      if (!email) return json({ message: "Email missing" }, 400);

      const profile = await Profile.findOne({ email });
      if (!profile) return json({ message: "Profile not found" }, 404);

      return json(profile, 200);
    } catch (err) {
      console.error("Get profile by email error:", err);
      return json({ message: "Server error" }, 500);
    }
  }

  return json({ message: "Not found" }, 404);
}

// PUT /profile -> update current user's profile (auth)
export async function PUT(req) {
  await connectToDb();
  const { pathname } = new URL(req.url);

  if (!pathname.endsWith("/profile")) return json({ message: "Not found" }, 404);

  try {
    const token = getAuthToken(req);
    if (!token) return json({ message: "No token provided" }, 401);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return json({ message: "Invalid token" }, 401);
    }

    const body = await req.json();
    const { desc, age, role } = body;
    if (!desc || age === undefined || !role) return json({ message: "Please fill all fields" }, 400);

    const updatedProfile = await Profile.findOneAndUpdate(
      { email: decoded.email },
      { desc, age, role },
      { new: true }
    );

    if (!updatedProfile) return json({ message: "Profile not found" }, 404);

    return json({ message: "Profile updated", profile: updatedProfile }, 200);
  } catch (err) {
    console.error("Update profile error:", err);
    return json({ message: "Server error" }, 500);
  }
}
