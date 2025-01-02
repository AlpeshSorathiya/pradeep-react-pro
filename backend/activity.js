const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Define the schema directly in the route file
const activitySchema = new mongoose.Schema({
  userName: { type: String, required: true },
  downloadedFiles: [
    {
      clientName: { type: String, required: true },
      fileName: { type: String, required: true },
      downloadTime: { type: Date, default: Date.now },
    },
  ],
});

// Create the Activity model based on the schema
const Activity = mongoose.model('Activity', activitySchema);

// Log login activity
router.post('/log/login', async (req, res) => {
  const { userName } = req.body;

  try {
    // Check if a log already exists for this session
    let activity = await Activity.findOne({ userName });

    if (!activity) {
      // Create a new log if none exists
      activity = await Activity.create({ userName });
    }

    res.status(201).json({ message: 'Login activity logged', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error logging login activity', error });
  }
});

// Log file download activity
router.post('/log/download', async (req, res) => {
  const { clientName, userName, fileName } = req.body;

  try {
    // Find the activity for the user and client
    const activity = await Activity.findOne({ userName });

    if (!activity) {
      return res.status(404).json({ message: 'No active session found for this user' });
    }

    // Append file download details
    activity.downloadedFiles.push({ clientName,fileName, downloadTime: new Date() });
    await activity.save();

    res.status(201).json({ message: 'Download activity logged', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error logging download activity', error });
  }
});

// Fetch all activity logs (Admin side)
router.get('/all', async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ loginTime: -1 });
      res.json(activities)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity logs', error });
  }
});

// Fetch user-specific activity logs (Client side)
router.get('/user/:userName', async (req, res) => {
  try {
    const activities = await Activity.find({ userName: req.params.userName })
      .populate('fileName')
      .sort({ loginTime: -1 });

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user activity logs', error });
  }
});

module.exports = router;
