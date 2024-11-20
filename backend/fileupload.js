const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();

// Define File Schema
const FileSchema = new mongoose.Schema({
    clientName: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    userType: { type: mongoose.Schema.Types.ObjectId, ref: 'UserType', required: true },
    fileName: { type: String, required: true },
    fileType: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FileType', required: true }],
    uploadDate: { type: Date, default: Date.now },
});

const File = mongoose.model('File', FileSchema);

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
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

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|docs|psd/;
    const isValid = allowedTypes.test(file.mimetype) && allowedTypes.test(path.extname(file.originalname));
    cb(null, isValid);
};

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// POST route to upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { clientName, userType, fileType } = req.body;

  if (!clientName || !userType || !fileType) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  const newFile = new File({
      fileName: req.file.filename,
      clientName,
      userType,
      fileType: fileType.split(','), // Ensure fileType is an array
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
router.get('/files', async (req, res) => {
    try {
        const files = await File.find()
            .populate('clientName')
            .populate('userType')
            .populate('fileType');
        res.json(files);
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// PUT route to update a file's information
router.put('/:id', async (req, res) => {
    try {
        const { clientName, userType, fileType } = req.body;
        const updatedFile = await File.findByIdAndUpdate(req.params.id, {
            clientName,
            userType,
            fileType,
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

// delete a file
router.delete('/deletefile/:fileName', async (req, res) => {
  const { fileName } = req.params; 

  try {
    const fileToDelete = await File.findOne({ fileName }); 
    if (!fileToDelete) {
      return res.status(404).json({ error: 'File not found' }); 
    }

    const filePath = path.join(__dirname, 'uploads', fileToDelete.fileName); 
    await fs.promises.unlink(filePath); 

    await File.deleteOne({ fileName }); 
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error); // Log the error
    res.status(500).json({ error: 'Failed to delete file', details: error.message }); 
  }
});

// get a file data
router.get('/download/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the file by id
    const fileToDownload = await File.findById(id);
    if (!fileToDownload) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Construct the file path
    const filePath = path.join(__dirname, 'uploads', fileToDownload.fileName);
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
