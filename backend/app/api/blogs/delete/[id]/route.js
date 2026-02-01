import { NextResponse } from "next/server";
import { connectToDb } from "@/app/utils/mongo";
import { isValidObjectId } from "mongoose";
import { verifyToken } from "@/app/utils/token";
import mongoose from "mongoose";
import blogs from "@/Database/blogs";

export async function DELETE(req, { params }){
    try{
        await connectToDb();
        const token = req.headers.get("authorization");
        if(!token)
            return NextResponse.json({message:"Missing token"},{status:401})
        const accessToken = token.split(" ")[1]
        if(!accessToken)
             return NextResponse.json({message:"Missing token"},{status:401})
        const decoded = verifyToken(accessToken,"APP");
        if(!decoded && !decoded.user.email)
            return NextResponse.json({message:"Invalid token"},{status:400});
        const paramsList = await params;
        const id = paramsList?.id;
        if(!id)
            return NextResponse.json({message:"Id not found"},{status:400})
        const objectId = new mongoose.Types.ObjectId(id);
        if(!isValidObjectId(objectId))
            return NextResponse.json({message:"Invalid Id"},{status:400});
       const blog = await blogs.findByIdAndDelete(objectId);
        if(!blog)
            return NextResponse.json({message:"Blog not found"},{status:404})
        return NextResponse.json({message:"Blog deleted successfully"},{status:200})
    }
    catch(e){
        console.log(e)
        return NextResponse.json({message:"Internal server error"},{status:500})

    }
}