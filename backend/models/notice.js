import mongoose from "mongoose";
const { Schema } = mongoose;

const noticeSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    file: {
        type: String, 
        required: true,
        unique: true,
    },
    publishedDate: {
        type: Date,
        required: true,
    },
    fileName: { 
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: false,
    }
});

export default mongoose.model('Notice', noticeSchema);