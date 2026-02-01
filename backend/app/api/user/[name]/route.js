import { NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/token";
import Profile from "@/Database/profile";
import { connectToDb } from "@/app/utils/mongo";
import { headers } from "next/headers";

export async function GET(req, { params }) {
  try {
    await connectToDb();
    const headersList = await headers();
    const authHeader = headersList.get("authorization").split(" ")[1];
    const decoded = verifyToken(authHeader, "APP");
    if (!decoded && !decoded.email) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
    const { name } = await params;
    if (!name) {
      return NextResponse.json({ message: "Name not found" }, { status: 400 });
    }
    if (typeof name !== "string") {
      return res.status(400).json({ message: "Invalid search term" });
    }
    const decodedName = decodeURIComponent(name);

    const cleanName = decodedName.trim().replace(/[^a-zA-Z0-9 ]/g, "");

    if (!cleanName) {
      return res.status(400).json({ message: "Invalid search term" });
    }


    const users = await Profile.find({
      name: { $regex: new RegExp(cleanName, "i") }
    }).limit(10);
    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ profile }, { status: 200 });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
