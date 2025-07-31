import mongoose from 'mongoose';
const { Schema } = mongoose;

const documentSchema = new Schema({
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  fileType: { type: String },
  fileSize: { type: Number }
});

export default documentSchema;