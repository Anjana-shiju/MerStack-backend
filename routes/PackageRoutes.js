const express = require("express");
const router = express.Router();
const Package = require("../models/Package");
const auth = require("../middleware/authMiddleware");


// ---------------- GET ALL PACKAGES ----------------
router.get("/", async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
});


// ---------------- SEARCH PACKAGE ----------------
router.get("/search", async (req, res) => {
  try {
    const { place } = req.query;

    if (!place) {
      return res.status(400).json({ message: "Place query is required" });
    }

    const packages = await Package.find({
      destination: { $regex: place, $options: "i" }
    }).sort({ createdAt: -1 });

    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
});


// ---------------- CREATE PACKAGE ----------------
router.post("/", auth, async (req, res) => {
  try {
    const newPackage = new Package(req.body);
    await newPackage.save();
    res.status(201).json(newPackage);
  } catch (err) {
    res.status(500).json({ message: "Create failed" });
  }
});


// ---------------- UPDATE PACKAGE ----------------
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});


// ---------------- DELETE PACKAGE ----------------
router.delete("/:id", auth, async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ message: "Package deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
