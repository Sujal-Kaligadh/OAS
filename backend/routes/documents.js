import express from 'express';
import multer from 'multer';
import documentSchema from '../models/documents.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'documents-attachments'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { files: 5 }
});

// Create a Mongoose model for standalone documents
const Document = mongoose.model('Document', documentSchema);

// POST /api/documents - upload up to 5 documents
router.post('/', upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }
    if (req.files.length > 5) {
      return res.status(400).json({ error: 'You can upload a maximum of 5 documents at a time.' });
    }
    const docs = req.files.map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size
    }));
    const savedDocs = await Document.insertMany(docs);
    res.status(201).json(savedDocs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents - list all documents
router.get('/', async (req, res) => {
  try {
    const docs = await Document.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/documents/:id - update document metadata
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document ID.' });
    }
    
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    
    if (fileName) {
      doc.fileName = fileName;
    }
    
    const updatedDoc = await doc.save();
    res.json(updatedDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/documents/:id - delete document and file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document ID.' });
    }
    
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    
    // Delete the physical file
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    
    // Delete from database
    await Document.findByIdAndDelete(id);
    
    res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;