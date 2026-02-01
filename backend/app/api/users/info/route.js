import { NextResponse } from "next/server";
import { connectToDb } from "@/app/utils/mongo";
import { verifyToken } from "@/app/utils/token";
import Profile from "@/Database/profile";
import blogs from "@/Database/blogs";
import { headers } from "next/headers";

export async function GET(req) {
  try {
    await connectToDb();
    const headersList = await headers();
    const token = headersList.get("authorization");
    if (!token)
      return NextResponse.json({ message: "Missing token" }, { status: 401 });
    const accessToken = token.split(" ")[1];
    if (!accessToken)
      return NextResponse.json({ message: "Missing token" }, { status: 401 });
    const decoded = verifyToken(accessToken, "APP");
    if (!decoded && !decoded.user.email)
      return NextResponse.json({ message: "invalid token" }, { status: 400 });
    const userProfile = await Profile.findOne({ email: decoded.user.email }).lean();
    
    if (!userProfile)
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    const userBlogs = await blogs
      .find({ email: userProfile.email })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(
      {
        ...userProfile,
        blogs: userBlogs,
      },
      { status: 200 },
    );
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { message: "Internal Server error" },
      { status: 500 },
    );
  }
}
