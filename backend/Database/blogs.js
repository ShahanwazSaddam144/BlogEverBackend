import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    email: { type: String, required: true },
    createdby: { type: String, required: true },
    name: { type: String, required: true },
    desc: { type: String, required: true },
    category: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now },
});

// Prevent recompiling the model if it already exists
const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);

export default Blog;
