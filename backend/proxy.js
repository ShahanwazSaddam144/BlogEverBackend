// app/middleware.js
import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = ["*"]; 

export function middleware(req) { // Note: ensure this is named 'middleware' for Next.js
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 }); 
    res.headers.set("Access-Control-Allow-Origin", "*"); // Use "*" directly if ALLOWED_ORIGINS is ["*"]
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS"); // Added PATCH
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }

  // For other requests
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS"); // Added PATCH
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

// Apply middleware only to API routes
export const config = {
  matcher: "/api/:path*",
};