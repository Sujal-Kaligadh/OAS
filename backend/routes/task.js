import express from 'express';
import Task from '../models/tasks.js';
import fetchuser from '../middleware/fetchuser.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure task-attachments directory exists
const attachmentsDir = path.join(process.cwd(), 'task-attachments');
if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, attachmentsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = uniqueSuffix + '-' + file.originalname;
        cb(null, fileName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Add a new task
router.post('/addtask', fetchuser, upload.single('attachments'), async (req, res) => {
    try {
        const { taskId, recipient, message, link, status, priority, deadline } = req.body;

        // Validate required fields
        if (!recipient || !message || !status || !priority || !deadline) {
            return res.status(400).json({ error: 'Please fill all required fields' });
        }

        // Validate status enum
        if (!['Pending', 'In Progress', 'Completed', 'Overdue'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Validate priority enum
        if (!['Low', 'Medium', 'High'].includes(priority)) {
            return res.status(400).json({ error: 'Invalid priority value' });
        }

        // Create and save the task
        const task = new Task({
            taskId,
            recipient,
            assigner: req.user.id,
            message,
            link,
            attachments: req.file ? `/task-attachments/${req.file.filename}` : null,
            status,
            priority,
            deadline: new Date(deadline)
        });

        await task.save();
        res.status(201).json(task);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to add task' });
    }
});

// Get all tasks
router.get('/gettasks', fetchuser, async (req, res) => {
    const tasks = await Task.find();
    res.status(200).json(tasks);
});

router.get('/gettask/:id', fetchuser, async (req, res) => {
    const task = await Task.findById(req.params.id);
    res.status(200).json(task);
});


router.put('/updatestatus/:id', fetchuser, async (req, res) => {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json(task);
});

router.get('/assigned-tasks', fetchuser, async (req, res) => {
    try {
        const tasks = await Task.find({ assigner: req.user.id });
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching assigned tasks:', error);
        res.status(500).json({ error: 'Failed to fetch assigned tasks' });
    }
});

router.get('/my-tasks', fetchuser, async (req, res) => {
    try {
        const tasks = await Task.find({ recipient: req.user.id });
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching assigned tasks:', error);
        res.status(500).json({ error: 'Failed to fetch assigned tasks' });
    }
});

// Update a task
router.put('/updatetask/:id', fetchuser, upload.single('attachments'), async (req, res) => {
    try {
        const { taskId, recipient, message, link, status, priority, deadline } = req.body;

        // Validate required fields
        if (!recipient || !message || !status || !priority || !deadline) {
            return res.status(400).json({ error: 'Please fill all required fields' });
        }

        // Validate status enum
        if (!['Pending', 'In Progress', 'Completed', 'Overdue'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Validate priority enum
        if (!['Low', 'Medium', 'High'].includes(priority)) {
            return res.status(400).json({ error: 'Invalid priority value' });
        }

        // Create update object
        const updateData = {
            taskId,
            recipient,
            message,
            link,
            status,
            priority,
            deadline: new Date(deadline)
        };

        // If a new file was uploaded, add it to the update data
        if (req.file) {
            updateData.attachments = `/task-attachments/${req.file.filename}`;
        }

        // Find and update the task
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

export default router;
