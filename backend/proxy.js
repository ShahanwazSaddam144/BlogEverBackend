// app/middleware.js
import { NextResponse } from "next/server";

// Allowed origin(s)
const ALLOWED_ORIGINS = ["*"]; // Replace with your frontend domain in production

export function proxy(req) {
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 }); 
    res.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGINS.join(","));
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }

  // For other requests
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGINS.join(","));
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

// Apply middleware only to API routes
export const config = {
  matcher: "/api/:path*",
};
