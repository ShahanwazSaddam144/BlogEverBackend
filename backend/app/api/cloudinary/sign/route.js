
import cloudinary from "@/app/utils/cloudinaryConfig";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/token";
import { headers } from "next/headers";
export async function GET(req) {
  try {
    const headersList= await headers();
    const token = headersList.get("authorization").split(" ")[1];
    if(!token){
      return NextResponse.json({message:"Missing token"},{status:401});
    }
    const decoded = verifyToken(token,"APP");
    if(!decoded){
      return NextResponse.json({message:"Invalid token"},{status:401});
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "blog_images";
    const upload_preset = "BlogEver";

  
    const signatureString = `folder=${folder}&timestamp=${timestamp}&upload_preset=${upload_preset}${cloudinary.config().api_secret}`;
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");
    return NextResponse.json({
        timestamp,
        signature,
        folder,
        upload_preset, 
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