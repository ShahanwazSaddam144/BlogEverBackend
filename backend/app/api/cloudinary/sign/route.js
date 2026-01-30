import cloudinary from "@/app/utils/cloudinaryConfig";
import crypto from "crypto";
import { NextResponse } from "next/server";
export async function GET(req) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "blog_images";
    const upload_preset = "BlogEver";

  
    const signatureString = `folder=${folder}&timestamp=${timestamp}&upload_preset=${upload_preset}${cloudinary.config().api_secret}`;
    
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

    return NextResponse.json({
        timestamp,
        signature,
        folder,
        upload_preset, // Send this back so frontend stays in sync
        apiKey: cloudinary.config().api_key,
        cloudName: cloudinary.config().cloud_name,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
  }
}