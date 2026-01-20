import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    tokens: [
      {
        token: String,
      },
    ],
    isVerified: { type: Boolean, default: false },
    verifyToken: { type: String, default: null },
  },
  { timestamps: true }
);

// Use existing model if already compiled (prevents OverwriteModelError in hot-reload/dev)
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
