import { NextResponse } from "next/server";
import { verifyToken, generateToken } from "@/app/utils/token";
import User from "@/app/../Database/auth";

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { refreshToken } = body;
    if (!refreshToken) {
      return NextResponse.json(
        { message: "Missing refresh token" },
        { status: 400 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(refreshToken, "REFRESH");
    } catch (err) {
      return NextResponse.json(
        { message: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.sub).select("tokenVersion email");
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return NextResponse.json(
        { message: "Refresh token revoked" },
        { status: 401 }
      );
    }

    const accessToken = generateToken(
      {
        sub: user._id.toString(),
        email: user.email,
        name:user.name,
        tokenVersion: user.tokenVersion,
      },
      "APP",
      "1h"
    );

    return NextResponse.json({ accessToken }, { status: 200 });

  } catch (err) {
    console.error("authrefresh error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
