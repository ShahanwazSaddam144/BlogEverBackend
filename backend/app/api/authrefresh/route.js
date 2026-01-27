import { NextResponse } from "next/server";
import { verifyToken,generateToken } from "@/app/utils/token";

export async function POST(req){
    try{
        let body = {};
        try{
            body = await req.json();
        }catch(err){
            return NextResponse.json({message:"Invalid JSON body"},{status:400});
        }
        const {refreshToken} = body;
        if(!refreshToken){
            return NextResponse.json({message:"missing token"},{status:400})
        }
        const decoded = verifyToken(refreshToken,"REFRESH");
        if(!decoded){
            return NextResponse.json({message:"Invalid token"},{status:401});
        }
        const accessToken = generateToken(decoded.user,"AUTH","1h");
        return NextResponse.json({accessToken},{status:200});
    }
    catch(err){
        console.log("error in authrefresh file!",err);
        return NextResponse.json({message:"Server error"},{status:500});
    }
}