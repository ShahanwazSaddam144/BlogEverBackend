import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    index: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  desc: { type: String, required: true },
  age: { type: Number, required: true },
  role: { type: String, required: true },
}, { timestamps: true }); 


const Profile = mongoose.models.Profile || mongoose.model("Profile", profileSchema);

export default Profile;