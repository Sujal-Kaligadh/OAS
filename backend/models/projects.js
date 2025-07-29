import mongoose from 'mongoose';
const { Schema } = mongoose;

const projectSchema = new Schema({
    projectId: {
        type: String,
        required: true,
        unique: true,
        autoIncrement: true
    },
    projectName: {
        type: String,
        required: true
    },
    URL: {
        type: String
    },
    contactPerson:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required:true
    },
    phone:{
        required:true,
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    agreementDate: {
        type: Date
    },
    projectDocs: [{
        fileName: String,
        filePath: String,
        uploadDate: {
            type: Date,
            default: Date.now
        },
        fileType: String,
        fileSize: Number
    }],
    billingDate: {
        type: Date
    },
    billImage:{
        fileName: String,
        filePath: String,
        uploadDate: {
            type: Date,
            default: Date.now
        },
        fileType: String,
        fileSize: Number
    },
    billAmount:{
        type: Number,
        required: true,
        min: [0, 'Bill amount cannot be negative']
    }
});

const Project = mongoose.model('Project', projectSchema);

export default Project;    
