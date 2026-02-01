import { NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/token";
import Profile from "@/Database/profile";
import Blog from "@/Database/blogs";
import { connectToDb } from "@/app/utils/mongo";
import { headers } from "next/headers";
import validator from "validator";

export async function GET(req, { params }) {
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
    if (!decoded && !decoded.email) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
    const { email } = await params;
    if (!email) {
      return NextResponse.json({ message: "Email not found" }, { status: 400 });
    }
    if (typeof email !== "string" || !validator.isEmail(email)) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }
    const decodedEmail = decodeURIComponent(email);

    const userProfile = await Profile.findOne({ email: decodedEmail }).lean();

    if (!userProfile) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const userBlogs = await Blog.find({
      email: userProfile.email,
    })
      .sort({ createdAt: -1 })
      .lean();
      console.log(userBlogs)

    return NextResponse.json(
      {
        ...userProfile,
        blogs: userBlogs,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
