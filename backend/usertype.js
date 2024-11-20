const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Define UserType Schema
const UserTypeSchema = new mongoose.Schema({
  userType: { type: String, required: true }, // Ensure userType is required
  createdAt: { type: Date, default: Date.now },
});

// Auto-generate an incrementing ID
UserTypeSchema.pre("save", async function (next) {
  const count = await mongoose.model("UserType").countDocuments();
  this._id = count + 1; 
  next();
});

const UserType = mongoose.model("UserType", UserTypeSchema);

// Route to add a new user type with validation
router.post("/usertypes", async (req, res) => {
  const { userType } = req.body;

  // Validation: Check if userType is provided
  if (!userType || userType.trim() === "") {
    return res.status(400).json({ error: "User type is required" });
  }

  const newUserType = new UserType({
    userType,
  });

  try {
    await newUserType.save();
    res.status(201).json({
      message: "User type added successfully",
      userId: newUserType._id,
      userType: newUserType.userType,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "Failed to add user type" });
  }
});

// Route to get all user types
router.get("/usertypes", async (req, res) => {
  try {
    const userTypes = await UserType.find();
    res.json(userTypes);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "Failed to retrieve user types" });
  }
});

// Route to update a user type
router.put("/usertypes/:id", async (req, res) => {
  const userTypeId = req.params.id;
  const { userType } = req.body;

  // Validate the input
  if (!userType || userType.trim() === "") {
    return res.status(400).json({ error: "User type is required" });
  }

  try {
    const updatedUserType = await UserType.findByIdAndUpdate(
      userTypeId,
      { userType },
      { new: true, runValidators: true } // Return the updated document and enforce validation
    );

    if (!updatedUserType) {
      return res.status(404).json({ error: "User type not found" });
    }

    res.status(200).json({
      message: "User type updated successfully",
      userType: updatedUserType,
    });
  } catch (error) {
    console.error("Error updating user type:", error);
    res.status(500).json({ error: "Failed to update user type" });
  }
});

// Route to delete a user type
router.delete("/usertypes/:id", async (req, res) => {
  const userTypeId = req.params.id;

  try {
    const deletedUserType = await UserType.findByIdAndDelete(userTypeId);

    if (!deletedUserType) {
      return res.status(404).json({ error: "User type not found" });
    }

    res.status(200).json({ message: "User type deleted successfully" });
  } catch (error) {
    console.error("Error deleting user type:", error);
    res.status(500).json({ error: "Failed to delete user type" });
  }
});

module.exports = router;
