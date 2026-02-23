const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    title: String,
    destination: String,   
    price: Number,
    description: String,
    image: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
