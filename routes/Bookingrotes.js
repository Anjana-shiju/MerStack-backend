const express = require("express");
const Booking = require("../models/Booking");

const router = express.Router();

// Create booking (User)
router.post("/", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json({ message: "Booking saved", booking });
  } catch (err) {
    res.status(500).json({ message: "Error saving booking" });
  }
});

//  Get all bookings (Admin)
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

//  Update booking status (Admin)
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    await Booking.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

module.exports = router;
