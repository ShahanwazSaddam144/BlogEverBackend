// app/api/blog/blogs/by-email/[email]/route.js
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/utils/mongo";
import Blog from "@/Database/blogs";

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(request, { params }) {
  await connectToDb();
  try {
    const { email } = params || {};
    if (!email) return json({ message: "Email param missing" }, 400);

    const blogs = await Blog.find({ email });
    if (!blogs || blogs.length === 0) return json({ message: "No blogs found" }, 404);

    return json({ blogs }, 200);
  } catch (err) {
    console.error("Fetch by email error:", err);
    return json({ message: "Server Error" }, 500);
  }
}
