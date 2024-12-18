//user.js file
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// User Schema
const UserSchema = new mongoose.Schema({
  clientName: [{ type: mongoose.Schema.Types.ObjectId,ref:'Client', required: true }],
  userType: { type: mongoose.Schema.Types.ObjectId, ref :'UserType', required: true },
  Name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fileType: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FileType', required: true }],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);



// Route to get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
    .populate('fileType')
    .populate('userType')
    .populate('clientName')

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});




// Route to add a new user
router.post("/users", async (req, res) => {
  const { clientName, userType, Name, username, password, fileType } = req.body;

  if (!clientName || !userType || !username || !password || !fileType || !Name) {
    return res.status(400).json({ error: "All fields including fileType are required" });
  }

  // Ensure clientName is always an array
  const normalizedClientName = Array.isArray(clientName) ? clientName : [clientName];

  const newUser = new User({
    clientName: normalizedClientName,
    userType,
    Name,
    username,
    password,
    fileType,
  });

  try {
    await newUser.save();
    res.status(201).json({ message: "User added successfully", userId: newUser._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add user" });
  }
});



// Route to update a user
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { clientName, username, Name, userType, password, fileType } = req.body;

  if (!clientName || !userType || !username || !Name) {
    return res.status(400).json({ error: "All fields except password are required" });
  }

  // Ensure clientName is always an array
  const normalizedClientName = Array.isArray(clientName) ? clientName : [clientName];

  let updatedFields = {
    clientName: normalizedClientName,
    username,
    Name,
    userType,
    fileType,
  };

  if (password) {
    updatedFields.password = password; 
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(id, updatedFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});


// Route to delete a user
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const users = await User.find()
      .populate('clientName')
      .populate('userType')
      .populate('fileType');

    const userFound = users.find(
      (user) => user.username === username && user.password === password
    );

    if (!userFound) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      {
        id: userFound._id,
        Name: userFound.Name,
        username: userFound.username,
        userType: userFound.userType.userType,
        clientName: userFound.clientName.map(client => client.clientName), // Map for array
        fileType: userFound.fileType.map(file => file.fileType),
      },
      "user",
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


module.exports = router;
