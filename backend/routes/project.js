import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { body, validationResult } from 'express-validator';
import Project from '../models/projects.js';
import fetchuser from '../middleware/fetchuser.js';

const router = express.Router();



// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/projects';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files per upload
    }
});

// Route 1: Create a new project - POST /api/projects/createproject
router.post('/createproject', fetchuser, [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address'),
    body('phone')
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be 10 digits'),
    body('URL')
        .optional()
        .isURL()
        .withMessage('Please enter a valid URL')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { projectName, URL, contactPerson, email, phone, agreementDate, billingDate, billAmount } = req.body;

        // Validate required fields
        if (!projectName || !contactPerson || !email || !phone) {
            return res.status(400).json({ 
                error: "Missing required fields",
                details: {
                    projectName: !projectName ? "Project name is required" : null,
                    contactPerson: !contactPerson ? "Contact person is required" : null,
                    email: !email ? "Email is required" : null,
                    phone: !phone ? "Phone is required" : null
                }
            });
        }

        // Create new project
        const project = new Project({
            projectId: req.body.projectId,
            projectName: projectName.trim(),
            URL: URL ? URL.trim() : undefined,
            contactPerson: contactPerson.trim(),
            email: email.trim(),
            phone: phone.trim(),
            agreementDate: agreementDate ? new Date(agreementDate) : undefined,
            billingDate: billingDate ? new Date(billingDate) : undefined,
            billAmount: billAmount ? parseFloat(billAmount) : 0
        });

        const savedProject = await project.save();
        res.status(201).json(savedProject);
    } catch (error) {
        // Handle specific MongoDB errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: "Validation Error", 
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                error: "Duplicate Error", 
                details: "A project with this ID already exists"
            });
        }

        // Generic error response
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Route 2: Get all projects - GET /api/projects
router.get('/getprojects', fetchuser, async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route 3: Get project by ID - GET /api/projects/:id
router.get('/getprojects/:id', fetchuser, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send("Project not found");
        }
        res.json(project);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route 4: Update project - PUT /api/projects/:id
router.put('/updateprojects/:id', fetchuser, [
    body('email')
        .optional()
        .isEmail()
        .withMessage('Please enter a valid email address'),
    body('phone')
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be 10 digits')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { projectName, URL, contactPerson, email, phone, agreementDate, billingDate, billAmount } = req.body;

        // Create new project object
        const newProject = {};
        if (projectName) newProject.projectName = projectName;
        if (URL) newProject.URL = URL;
        if (contactPerson) newProject.contactPerson = contactPerson;
        if (email) newProject.email = email;
        if (phone) newProject.phone = phone;
        if (agreementDate) newProject.agreementDate = agreementDate;
        if (billingDate) newProject.billingDate = billingDate;
        if (billAmount) newProject.billAmount = parseFloat(billAmount);

        // Find and update project
        let project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send("Project not found");
        }

        project = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: newProject },
            { new: true }
        );
        res.json(project);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route 5: Delete project - DELETE /api/projects/:id
router.delete('/deleteprojects/:id', fetchuser, async (req, res) => {
    try {
        // Find and delete project
        let project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send("Project not found");
        }

        project = await Project.findByIdAndDelete(req.params.id);
        res.json({ "Success": "Project has been deleted", project: project });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route 6: Upload multiple project documents - POST /api/projects/:id/documents
router.post('/:id/documents', fetchuser, upload.array('documents', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send("No files uploaded");
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            // Delete uploaded files if project not found
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
            return res.status(404).send("Project not found");
        }

        const uploadedDocs = req.files.map(file => ({
            fileName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size
        }));

        // Add all documents to the project
        project.projectDocs.push(...uploadedDocs);
        await project.save();

        res.json({
            message: `${uploadedDocs.length} document(s) uploaded successfully`,
            documents: uploadedDocs
        });
    } catch (error) {
        // Delete uploaded files if there's an error
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route 7: Get all documents for a project - GET /api/projects/:id/documents
router.get('/:id/documents', fetchuser, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send("Project not found");
        }

        res.json(project.projectDocs);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route 8: Delete a document - DELETE /api/projects/:id/documents/:docId
router.delete('/:id/documents/:docId', fetchuser, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send("Project not found");
        }

        const document = project.projectDocs.id(req.params.docId);
        if (!document) {
            return res.status(404).send("Document not found");
        }

        // Delete file from filesystem
        if (fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }

        // Remove document from project
        project.projectDocs.pull(req.params.docId);
        await project.save();

        res.json({ message: "Document deleted successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route 9: Download a document - GET /api/projects/:id/documents/:docId/download
router.get('/:id/documents/:docId/download', fetchuser, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send("Project not found");
        }

        const document = project.projectDocs.id(req.params.docId);
        if (!document) {
            return res.status(404).send("Document not found");
        }

        if (!fs.existsSync(document.filePath)) {
            return res.status(404).send("File not found on server");
        }

        res.download(document.filePath, document.fileName);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route 10: Upload bill image - POST /api/projects/:id/bill-image
router.post('/:id/bill-image', fetchuser, upload.single('billImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            // Delete uploaded file if project not found
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).send("Project not found");
        }

        // Update project with bill image details
        project.billImage = {
            fileName: req.file.originalname,
            filePath: req.file.path,
            uploadDate: new Date(),
            fileType: req.file.mimetype,
            fileSize: req.file.size
        };

        await project.save();

        res.json({
            message: "Bill image uploaded successfully",
            billImage: project.billImage
        });
    } catch (error) {
        // Delete uploaded file if there's an error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route 11: Get bill image - GET /api/projects/:id/bill-image
router.get('/:id/bill-image', fetchuser, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send("Project not found");
        }

        if (!project.billImage || !project.billImage.filePath) {
            return res.status(404).send("Bill image not found");
        }

        if (!fs.existsSync(project.billImage.filePath)) {
            return res.status(404).send("Bill image file not found on server");
        }

        res.download(project.billImage.filePath, project.billImage.fileName);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Route 12: Delete bill image - DELETE /api/projects/:id/bill-image
router.delete('/:id/bill-image', fetchuser, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send("Project not found");
        }

        if (!project.billImage || !project.billImage.filePath) {
            return res.status(404).send("Bill image not found on project");
        }

        const filePath = project.billImage.filePath;

        // Remove bill image from project document
        project.billImage = undefined; // Or {} or null depending on schema
        await project.save();

        // Delete file from filesystem
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: "Bill image deleted successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

export default router;