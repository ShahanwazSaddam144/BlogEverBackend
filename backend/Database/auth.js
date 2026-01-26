import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {type:String,require:true},
    email: {type:String,require:true},
    password: {type:String,require:true,minlength:8,maxlength:25},
    tokenVersion: {type:String,default:0,require:true},
    isVerified: { type: Boolean, default:false,require:true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
