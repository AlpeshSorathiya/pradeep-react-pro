
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require('dotenv');

// Create the Express application
const app = express();
dotenv.config();

// Get MongoDB URLs from environment variables
const localMongoUrl = process.env.MONGO_LOCAL_URL;
const remoteMongoUrl = process.env.MONGO_REMOTE_URL;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Function to connect to MongoDB
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(`${remoteMongoUrl}`);
    console.log("Connected to remote MongoDB");
  } catch (remoteError) {
    console.log("Failed to connect to remote MongoDB, trying local...");
    try {
      await mongoose.connect(`${localMongoUrl}/users`);
      console.log("Connected to local MongoDB");
    } catch (localError) {
      console.error("Failed to connect to both remote and local MongoDB", localError);
    }
  }
};

connectToMongoDB();

// Import routes for file types, user types, and clients
const fileTypeRoutes = require("./filetype");
const userTypeRoutes = require("./usertype");
const clientRoutes = require("./clients");
const userRoutes = require("./users");
const fileUploadRoutes = require("./fileupload");
const docsRoutes=require("./companydoc");
const path = require("path");
const activityRoutes=require("./activity");

app.use("/api", fileTypeRoutes);
app.use("/api", userTypeRoutes);
app.use("/api", clientRoutes);
app.use("/api", userRoutes);
app.use("/api", fileUploadRoutes);
app.use("/api", docsRoutes);
app.use("/api",activityRoutes);


app.use(express.static(path.join(__dirname, "../Frontend/build")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../Frontend/build/index.html"))
);


// Server port
const PORT = 8020;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
