import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  desc: { type: String, required: true },
  age: { type: Number, required: true },
  role: { type: String, required: true },
});

// Prevent recompiling the model if it already exists
const Profile = mongoose.models.Profile || mongoose.model("Profile", profileSchema);

export default Profile;
