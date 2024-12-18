const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();

// Define File Schema
const CompanyDocSchema = new mongoose.Schema({
    clientName: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    fileName: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
});

const CompanyDoc = mongoose.model('CompanyDoc', CompanyDocSchema);

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'Docuploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueFileName = Date.now() + "_" + file.originalname;
        cb(null, uniqueFileName);
    }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// POST route to upload a file
router.post('/docupload', upload.single('file'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { clientName } = req.body;

  if (!clientName) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  const newFile = new CompanyDoc({
      fileName: req.file.filename,
      clientName // Ensure fileType is an array
  });

  try {
      await newFile.save();
      res.status(201).json({
          message: 'File uploaded successfully',
          file: newFile,
      });
  } catch (error) {
      console.error("Error saving file:", error);
      res.status(500).json({ error: 'Failed to save file' });
  }
});

// GET route to fetch all uploaded files
router.get('/docfiles', async (req, res) => {
    try {
        const files = await CompanyDoc.find()
            .populate('clientName')
        res.json(files);
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// PUT route to update a file's information
router.put('/:id', async (req, res) => {
    try {
        const { clientName } = req.body;
        const updatedFile = await CompanyDoc.findByIdAndUpdate(req.params.id, {
            clientName
        }, { new: true });

        if (!updatedFile) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.json(updatedFile);
    } catch (error) {
        console.error("Error updating file:", error);
        res.status(500).json({ error: 'Failed to update file' });
    }
});

// DELETE route to delete a file
router.delete('/docdeletefile/:fileName', async (req, res) => {
  const { fileName } = req.params; 

  try {
    const fileToDelete = await CompanyDoc.findOne({ fileName }); 
    if (!fileToDelete) {
      return res.status(404).json({ error: 'File not found' }); 
    }

    const filePath = path.join(__dirname, 'Docuploads', fileToDelete.fileName); 
    await fs.promises.unlink(filePath); 

    await CompanyDoc.deleteOne({ fileName }); 
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error); 
    res.status(500).json({ error: 'Failed to delete file', details: error.message }); 
  }
});

// GET route to download a file
router.get('/docdownload/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the file by id
    const fileToDownload = await CompanyDoc.findById(id);
    if (!fileToDownload) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Construct the file path
    const filePath = path.join(__dirname, 'Docuploads', fileToDownload.fileName);
    if (fs.existsSync(filePath)) {
      // Send the file for download
      res.download(filePath, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          res.status(500).json({ error: 'Failed to download file', details: err.message });
        }
      });
    } else {
      res.status(404).json({ error: 'File not found on server' });
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file', details: error.message });
  }
});

module.exports = router;
