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
    if (!decoded || !decoded.user || !decoded.user.email)
      return NextResponse.json({ message: "invalid token" }, { status: 400 });

    const userProfile = await Profile.findOne({
      email: decoded.user.email,
    }).lean();

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

export async function PATCH(req) {
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
    if (!decoded || !decoded.user || !decoded.user.email)
      return NextResponse.json({ message: "invalid token" }, { status: 400 });

    const email = decoded.user.email;

    // parse body
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    // Accept only allowed partial fields
    const allowedKeys = ["desc", "role", "dob"];
    const updates = {};
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No updatable fields provided" },
        { status: 400 },
      );
    }

    // Validate fields
    if (updates.desc !== undefined && updates.desc !== null) {
      if (typeof updates.desc !== "string")
        return NextResponse.json({ message: "Invalid desc" }, { status: 422 });
      updates.desc = updates.desc.trim();
      if (updates.desc.length > 1000)
        return NextResponse.json(
          { message: "Description too long" },
          { status: 422 },
        );
    }

    if (updates.role !== undefined && updates.role !== null) {
      if (typeof updates.role !== "string")
        return NextResponse.json({ message: "Invalid role" }, { status: 422 });
      updates.role = updates.role.trim();
      if (updates.role.length > 200)
        return NextResponse.json({ message: "Role too long" }, { status: 422 });
    }

    // dob can be an ISO string or null to unset
    let computedAge = undefined;
    if (Object.prototype.hasOwnProperty.call(updates, "dob")) {
      const val = updates.dob;
      if (val === null) {
        // explicit unset
        updates.dob = null;
        computedAge = 0;
      } else {
        // expect a string parseable as date
        const parsed = new Date(val);
        if (isNaN(parsed.getTime()))
          return NextResponse.json({ message: "Invalid dob" }, { status: 422 });
        // no future dates
        if (parsed > new Date())
          return NextResponse.json(
            { message: "DOB cannot be in the future" },
            { status: 422 },
          );

        // normalize to ISO string
        updates.dob = parsed.toISOString();

        // compute age
        const today = new Date();
        let age = today.getFullYear() - parsed.getFullYear();
        const m = today.getMonth() - parsed.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) age--;
        computedAge = age < 0 ? 0 : age;
      }
    }

    // Build Mongo update
    const setObj = {};
    const unsetObj = {};

    if (updates.desc !== undefined) setObj.desc = updates.desc;
    if (updates.role !== undefined) setObj.role = updates.role;

    if (Object.prototype.hasOwnProperty.call(updates, "dob")) {
      if (updates.dob === null) {
        // unset dob and set age to 0
        unsetObj.dob = "";
        setObj.age = 0;
      } else {
        setObj.dob = updates.dob;
        setObj.age = computedAge !== undefined ? computedAge : 0;
      }
    }

    const updateCommand = {};
    if (Object.keys(setObj).length > 0) updateCommand.$set = setObj;
    if (Object.keys(unsetObj).length > 0) updateCommand.$unset = unsetObj;

    if (Object.keys(updateCommand).length === 0) {
      return NextResponse.json(
        { message: "Nothing to update" },
        { status: 400 },
      );
    }

    // Perform update & return the updated document
    const updated = await Profile.findOneAndUpdate({ email }, updateCommand, {
      new: true,
      projection: { password: 0, tokens: 0 },
    }).lean();

    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // fetch blogs
    const userBlogs = await blogs
      .find({ email: updated.email })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        ...updated,
        blogs: userBlogs,
      },
      { status: 200 },
    );
  } catch (e) {
    console.error("PATCH /api/user/info error:", e);
    return NextResponse.json(
      { message: "Internal Server error" },
      { status: 500 },
    );
  }
}
