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
  desc: { type: String, required: false },
  age: { type: Number, required: false },
  role: { type: String, required: false },
}, { timestamps: true }); 


const Profile = mongoose.models.Profile || mongoose.model("Profile", profileSchema);

export default Profile;