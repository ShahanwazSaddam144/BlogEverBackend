// app/api/blog/my-blogs/[id]/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDb } from "@/app/utils/mongo";
import Blog from "@/Database/blogs";

const JWT_SECRET = process.env.JWT_SECRET || "a1f4b7d8e9c0f2a3b5c6d7e8f9a0b1c2";

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}
function getAuthToken(req) {
  const header = req.headers.get("authorization") || "";
  const parts = header.split(" ");
  return parts.length === 2 ? parts[1] : null;
}

export async function DELETE(req, { params }) {
  await connectToDb();
  try {
    const token = getAuthToken(req);
    if (!token) return json({ message: "No token provided" }, 401);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return json({ message: "Invalid token" }, 401);
    }

    const { id } = params || {};
    if (!id) return json({ message: "ID missing" }, 400);

    const blog = await Blog.findOne({ _id: id, email: decoded.email });
    if (!blog) return json({ message: "Unauthorized or blog not found" }, 401);

    await Blog.deleteOne({ _id: id });
    return json({ message: "Blog deleted successfully" }, 200);
  } catch (err) {
    console.error("Delete blog error:", err);
    return json({ message: "Server error" }, 500);
  }
}
