import mongoose from 'mongoose';
const { Schema } = mongoose;

const taskSchema = new Schema({
    taskId: {
        type: String,
        required: true,
        unique: true,
        autoIncrement: true
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assigner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: { 
        type: String,
        required: false
    },
    attachments: {
        type: String,
        required: false
    },  
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'In Progress', 'Completed', 'Overdue'],
        default: 'Pending'
    },
    priority: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    deadline: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Task = mongoose.model('Task', taskSchema);

export default Task;    
