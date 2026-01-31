import { NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/token";
import { headers } from "next/headers";
import { connectToDb } from "@/app/utils/mongo";
import Blog from "@/Database/blogs"; // Ensure this is your Mongoose model
import { isValidObjectId } from "mongoose";

export async function GET(req) {
  try {
    await connectToDb();
    
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Missing or invalid token format" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token, "APP");

    // Check if decoded exists and contains the user ID
    if (!decoded || !decoded.user?._id) {
      return NextResponse.json({ message: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const userId = decoded.user._id;

    if (!isValidObjectId(userId)) {
      return NextResponse.json({ message: "Invalid User ID format" }, { status: 400 });
    }

    const userBlogs = await Blog.find({ userid: userId })
      .select("name") 
      .lean(); 

    return NextResponse.json({ 
      success: true, 
      blogs: userBlogs 
    }, { status: 200 });

  } catch (e) {
    console.error("Fetch User Blogs Error:", e);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}