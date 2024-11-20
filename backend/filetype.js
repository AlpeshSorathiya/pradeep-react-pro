const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const router = express.Router();

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) return res.sendStatus(401); 

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); 

    
    if (user.userType !== 'Admin') {
      return res.status(403).json({ error: "Access denied. Only Admins can perform this action." });
    }

    req.user = user; 
    next(); 
  });
};


const FileTypeSchema = new mongoose.Schema({
  fileType: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
});


FileTypeSchema.pre("save", async function (next) {
  const count = await mongoose.model("FileType").countDocuments();
  this._id = count + 1;
  next();
});

const FileType = mongoose.model("FileType", FileTypeSchema);

// add file-type
router.post("/filetypes", async (req, res) => {
  const { fileType } = req.body;

  if (!fileType || fileType.trim() === "") {
    return res.status(400).json({ error: "File type is required" });
  }

  const newFileType = new FileType({
    fileType,
  });

  try {
    await newFileType.save();
    res.status(201).json({
      message: "File type added successfully",
      fileId: newFileType._id,
      fileType: newFileType.fileType,
    });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: "Failed to add file type" });
  }
});

// get all file-type
router.get("/filetypes", async (req, res) => {
  try {
    const fileTypes = await FileType.find();
    res.json(fileTypes);
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: "Failed to retrieve file types" });
  }
});

// update file-type
router.put("/filetypes/:id", async (req, res) => {
  const fileTypeId = req.params.id;
  const { fileType } = req.body;

  // Validation: Ensure fileType is provided and not empty
  if (!fileType || fileType.trim() === "") {
    return res.status(400).json({ error: "File type is required" });
  }

  try {
    const updatedFileType = await FileType.findByIdAndUpdate(
      fileTypeId,
      { fileType },
      { new: true, runValidators: true } // Return the updated file type and enforce schema validation
    );

    if (!updatedFileType) {
      return res.status(404).json({ error: "File type not found" });
    }

    res.status(200).json({
      message: "File type updated successfully",
      fileType: updatedFileType,
    });
  } catch (error) {
    console.error("Error updating file type:", error);
    res.status(500).json({ error: "Failed to update file type" });
  }
});

// Route to delete a file type (Admin only)
router.delete("/filetypes/:id", async (req, res) => {
  const fileTypeId = req.params.id;

  try {
    const deletedFileType = await FileType.findByIdAndDelete(fileTypeId);

    if (!deletedFileType) {
      return res.status(404).json({ error: "File type not found" });
    }

    res.status(200).json({ message: "File type deleted successfully" });
  } catch (error) {
    console.error("Error deleting file type:", error);
    res.status(500).json({ error: "Failed to delete file type" });
  }
});

module.exports = router;
