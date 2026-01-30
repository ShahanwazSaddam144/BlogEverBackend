import mongoose from 'mongoose';

const UploadSessionSchema = new mongoose.Schema({
  uploadId: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  expectedContentType: { type: String },
  expectedSize: { type: Number }, // optional
  bucketPath: { type: String }, // e.g. temp/<uploadId>/<fileName> or confirmed/...
  status: { type: String, enum: ['pending','confirmed','failed','expired'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

export default mongoose.models.UploadSession || mongoose.model('UploadSession', UploadSessionSchema);
