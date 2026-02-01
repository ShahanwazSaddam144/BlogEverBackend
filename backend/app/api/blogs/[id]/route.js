import { NextResponse } from "next/server";
import { connectToDb } from "@/app/utils/mongo";
import blogs from "@/Database/blogs";
import { isValidObjectId } from "mongoose";
import { verifyToken } from "@/app/utils/token";
import mongoose from "mongoose";
export async function GET(req,{params}){
    try{
        await connectToDb();
        const token = req.headers.get("authorization");
        if(!token)
            return NextResponse.json({message:"Missing token"},{status:401})
        const accessToken = token.split(" ")[1];
        if(!accessToken)
            return NextResponse.json({message:"Missing token"},{status:401})
        const decoded = verifyToken(accessToken,"APP");
        if(!decoded && !decoded.user.email)
            return NextResponse.json({message:"Invalid token"},{status:401})
        const parmasList= await params;
        
        const id = parmasList?.id
        if(!id)
            return NextResponse.json({message:"Id not found"},{status:400})
        const objectId = new mongoose.Types.ObjectId(id);
        if(!isValidObjectId(objectId))
            return NextResponse.json({message:"Invalid Id"},{status:400})

        const blog = await blogs.findById(objectId).lean();
        if(!blog)
            return NextResponse.json({message:"Blog not found"},{status:404})
        return NextResponse.json({blog},{status:200})
    }
    catch(e){
        console.log("Error in blog/id file: ",e);
        return NextResponse.json({message:"internal server error"},{status:500})
    }
}