import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, minlength: 8, maxlength: 25 },
    tokenVersion: { type: String, default: 0, required: true },
    isVerified: { type: Boolean, default: false, required: true },
    verificationToken: { type: String, required: false },
    verificationTokenExpires: { type: Date, required: false }, 
  },
  { timestamps: true }
);
userSchema.index({ verificationTokenExpires: 1 }, { expireAfterSeconds: 0 });
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
