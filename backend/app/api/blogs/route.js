import { NextResponse } from "next/server";
import {connectToDb} from "@/app/utils/mongo";
import Blog from "@/app/../Database/blogs";
import { headers } from "next/headers";
import { verifyToken } from "@/app/utils/token";

export async function GET(req) {
  try {
    await connectToDb();
    const headersList= await headers();
    const token = headersList.get("authorization");
    if(!token){
      return NextResponse.json({message:"Missing token"},{status:401});
    }
    const accessToken=token.split(" ")[1];
    if(!accessToken){
      return NextResponse.json({message:"Missing token"},{status:401});
    }
    const decoded = verifyToken(accessToken,"APP");
    if(!decoded && !decoded.user.email){
      return NextResponse.json({message:"Invalid token"},{status:401});
    }
    
    const { searchParams } = new URL(req.url);

    // pagination params
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;

    const skip = (page - 1) * limit;

    // fetch blogs
    const blogs = await Blog.find({})
      .sort({ publishedAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .lean();

    // total count (for hasMore)
    const totalBlogs = await Blog.countDocuments();

    const hasMore = skip + blogs.length < totalBlogs;

    return NextResponse.json(
      {
        blogs,
        page,
        limit,
        hasMore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch blogs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}
