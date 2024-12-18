const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();



const activitySchema = new mongoose.Schema({
  clientName: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  username: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  fileName: { type: String, required: true },
  activityType: { type: String, enum: ['Login', 'Download'], required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Activity', activitySchema);

// Log file download activity
router.post('/log', async (req, res) => {
  const { clientId, userId, fileId, fileName, activityType } = req.body;

  try {
    const newActivity = await Activity.create({
      clientId,
      userId,
      fileId,
      fileName,
      activityType,
    });

    res.status(201).json({ message: 'Activity logged successfully', newActivity });
  } catch (error) {
    res.status(500).json({ message: 'Error logging activity', error });
  }
});

// Fetch all activity logs (Admin side)
router.get('/all', async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('clientName')
      .populate('username')
      .populate('fileId', 'fileName')
      .sort({ timestamp: -1 });

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity logs', error });
  }
});

// Fetch user-specific activity logs (Client side)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const activities = await Activity.find({ userId })
      .populate('fileId', 'fileName')
      .sort({ timestamp: -1 });

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user activity logs', error });
  }
});

module.exports = router;
