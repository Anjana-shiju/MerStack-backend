const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    gender: String,
    age: Number,
    phone: String,
    package: String,
    people: Number,
    date: String,
    status: {
      type: String,
      default: "pending", // pending | confirmed | rejected
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
