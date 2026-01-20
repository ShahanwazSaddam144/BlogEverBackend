// app/api/blog/blogs/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDb } from "@/app/utils/mongo";
import Blog from "@/Database/blogs";

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(request, { params }) {
  await connectToDb();
  try {
    const { id } = params || {};
    if (!id) return json({ message: "ID missing" }, 400);

    const blog = await Blog.findById(id);
    if (!blog) return json({ message: "Blog not found" }, 404);

    return json({ blog }, 200);
  } catch (err) {
    console.error("Fetch single blog error:", err);
    return json({ message: "Server error" }, 500);
  }
}
