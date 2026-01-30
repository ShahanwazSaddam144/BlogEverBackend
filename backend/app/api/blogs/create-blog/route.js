// app/api/blogs/route.js
import { NextResponse } from "next/server";
import { connectToDb as connectToDatabase} from "@/app/utils/mongo";
import cloudinary from "@/app/utils/cloudinaryConfig";
import Blog from "@/app/../Database/blogs"; // adjust path if your model is elsewhere


function parseCloudinaryPublicId(url) {
  try {
    const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    if (!m) return null;
    return m[1]; // e.g. blog_images/nzsgkcylw8msmg78xfn6
  } catch (err) {
    return null;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Validate required fields
    const { title, body: desc, category, publishedAt, author, email, cdnImageUrl } = body;
    if (!title || !desc || !category) {
      return NextResponse.json({ error: "Missing required fields (title, body, category)" }, { status: 400 });
    }

    await connectToDatabase();

    const image = {
      url: cdnImageUrl || null,
      fileName: null,
      uploadId: null,
    };

    let uploadConfirmed = false;

    if (cdnImageUrl) {
      // Try derive public_id
      const publicId = parseCloudinaryPublicId(cdnImageUrl);
      try {
        if (publicId) {
          // cloudinary.api.resource will throw if not found
          const resource = await cloudinary.api.resource(publicId, { resource_type: "image" });
          // If no throw, resource exists
          uploadConfirmed = true;
          image.fileName = resource.original_filename || publicId.split("/").pop();
          image.uploadId = resource.public_id || publicId;
          // ensure we store the canonical secure_url if available
          image.url = resource.secure_url || cdnImageUrl;
        } else {
          // If we couldn't parse publicId, do a HEAD request fallback:
          // (Note: fetch from serverless runtime is allowed; this checks if URL responds)
          const fetchRes = await fetch(cdnImageUrl, { method: "HEAD" });
          if (fetchRes.ok) {
            uploadConfirmed = true;
          } else {
            uploadConfirmed = false;
          }
          // keep image.url as provided
        }
      } catch (err) {
        // resource not found or Cloudinary returned an error
        console.warn("Cloudinary resource check failed:", err.message || err);
        uploadConfirmed = false;
      }
    }

    // Create the blog document using your schema mapping
    // Your schema expects: email, createdby, name, desc, category, publishedAt, image
    const blogDoc = await Blog.create({
      email: email || "testing",
      createdby: author || "",
      name: title,
      desc,
      category,
      publishedAt: publishedAt ? new Date(publishedAt) : Date.now(),
      image,
    });

    return NextResponse.json(
      {
        success: true,
        blog: blogDoc,
        uploadConfirmed,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("create blog error:", err);
    return NextResponse.json({ error: "Failed to create blog", details: err.message || String(err) }, { status: 500 });
  }
}
