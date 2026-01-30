import { NextResponse } from "next/server";
import {connectToDb} from "@/app/utils/mongo";
import Blog from "@/app/../Database/blogs";

export async function GET(req) {
  try {
    await connectToDb();

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
