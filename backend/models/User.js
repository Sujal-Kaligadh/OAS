import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
    name:{
        type: String,
        required:true,
    },
    email: {
        type: String,
        required:true,
        unique:true
    },
    password: {
        type: String,
        required:true
    },
    phone: {
        type: Number,
        required: true,
        unique:true
    },
    type:{
        type: String,
        required: true,
        enum: ["User", "Manager"]
    }
  });
  export default mongoose.model('User', userSchema);