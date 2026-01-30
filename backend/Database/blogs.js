import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  email: { type: String, required: true },
  createdby: { type: String, required: true },
  name: { type: String, required: true },
  desc: { type: String, required: true },
  category: { type: String, required: true },
  publishedAt: { type: Date, default: Date.now },
  image: {
    url: String,
    fileName: String,
    uploadId: String,
  }
});

export default mongoose.models.Blog || mongoose.model('Blog', blogSchema);
