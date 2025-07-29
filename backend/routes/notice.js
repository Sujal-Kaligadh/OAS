import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Notice from '../models/notice.js';
import fetchuser from '../middleware/fetchuser.js'; 

const router = express.Router();

// Ensure the notices directory exists
const noticesDir = path.join(process.cwd(), 'notices');
if (!fs.existsSync(noticesDir)) {
    fs.mkdirSync(noticesDir, { recursive: true });
}

// Configure multer with filename customization
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, noticesDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = uniqueSuffix + '-' + file.originalname;
        cb(null, fileName);
    }
});

// Set up multer with error handling
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('noticeFile');

// Create notice endpoint
router.post('/createnotice', fetchuser, (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({ error: "File upload error", message: err.message });
        }
        
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            const newNotice = new Notice({
                title: req.body.title,
                file: `/notices/${req.file.filename}`,
                publishedDate: req.body.publishedDate || new Date(),
                description: req.body.description || "",
                fileName: req.file.originalname
            });

            const savedNotice = await newNotice.save();
            return res.status(201).json(savedNotice);
        } catch (error) {
            return res.status(500).json({ error: "Server error", message: error.message });
        }
    });
});

// Merge sort implementation
const mergeSort = (arr) => {
    if (arr.length <= 1) {
        return arr;
    }

    const mid = Math.floor(arr.length / 2);
    const left = arr.slice(0, mid);
    const right = arr.slice(mid);

    return merge(mergeSort(left), mergeSort(right));
};

const merge = (left, right) => {
    const result = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
        const leftDate = new Date(left[leftIndex].publishedDate);
        const rightDate = new Date(right[rightIndex].publishedDate);

        if (leftDate > rightDate) {
            result.push(left[leftIndex]);
            leftIndex++;
        } else {
            result.push(right[rightIndex]);
            rightIndex++;
        }
    }

    return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
};

// GET endpoint to fetch all notices
router.get('/getnotices', async (req, res) => {
    try {
        const notices = await Notice.find();
        // Convert notices to plain objects for sorting
        const noticesArray = notices.map(notice => notice.toObject());
        // Sort using merge sort
        const sortedNotices = mergeSort(noticesArray);
        res.json(sortedNotices);
    } catch (error) {
        res.status(500).json({ error: "Error fetching notices", message: error.message });
    }
});

// GET endpoint to fetch a single notice by ID
router.get('/getnotice/:id', async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({ error: "Notice not found" });
        }
        res.json(notice);
    } catch (error) {
        res.status(500).json({ error: "Error fetching notice", message: error.message });
    }
}); 

// PUT endpoint to update a notice by ID    
router.put('/updatenotice/:id', fetchuser, (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({ error: "File upload error", message: err.message });
        }
        
        try {
            const { title, publishedDate, description } = req.body;
            const updateData = { title, publishedDate, description };

            // If a new file was uploaded, add it to the update data
            if (req.file) {
                // Get the old notice to delete its file
                const oldNotice = await Notice.findById(req.params.id);
                if (oldNotice && oldNotice.file) {
                    const oldFilePath = path.join(noticesDir, oldNotice.file);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                }
                updateData.file = `/notices/${req.file.filename}`;
            }

            const notice = await Notice.findByIdAndUpdate(
                req.params.id, 
                updateData, 
                { new: true }
            );

            if (!notice) {
                return res.status(404).json({ error: "Notice not found" });
            }

            res.json(notice);
        } catch (error) {
            res.status(500).json({ error: "Error updating notice", message: error.message });
        }
    });
});

// DELETE endpoint to delete a notice by ID
router.delete('/deletenotice/:id', fetchuser, async (req, res) => {
    try {
        const notice = await Notice.findByIdAndDelete(req.params.id);
        if (!notice) {
            return res.status(404).json({ error: "Notice not found" });         
        }
        
        res.json({ message: "Notice deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting notice", message: error.message });
    }
});

export default router;