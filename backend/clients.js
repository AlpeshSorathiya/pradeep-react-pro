const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const ClientSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Client = mongoose.model("Client", ClientSchema);

// Route to add a new client with validation
router.post("/clients", async (req, res) => {
  const { clientName, address, email, phoneNumber } = req.body;

  // Validation: Check if fields are provided
  if (!clientName || !address || !email || !phoneNumber) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const newClient = new Client({
    clientName,
    address,
    email,
    phoneNumber,
  });

  try {
    await newClient.save();
    res.status(201).json({
      message: "Client added successfully",
      clientId: newClient._id,
      client: newClient,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "Failed to add client" });
  }
});

// Route to get all clients
router.get("/clients", async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "Failed to retrieve clients" });
  }
});


// Route to update client information
router.put("/clients/:id", async (req, res) => {
  const clientId = req.params.id;
  const { clientName, address, email, phoneNumber } = req.body;

  // Validation: Ensure fields are provided
  if (!clientName || !address || !email || !phoneNumber) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { clientName, address, email, phoneNumber },
      { new: true, runValidators: true } // Return the updated client and run schema validation
    );

    if (!updatedClient) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.status(200).json({
      message: "Client updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Route to delete a client
router.delete("/clients/:id", async (req, res) => {
  const clientId = req.params.id;

  try {
    const deletedClient = await Client.findByIdAndDelete(clientId);

    if (!deletedClient) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

module.exports = router;
