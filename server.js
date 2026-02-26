



require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------- DB CONNECTION ----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB Connected Successfully!"))
  .catch((err) => console.error(" Mongo Error:", err));

// ---------------- MULTER CONFIG ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "./uploads/";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ---------------- AUTH MIDDLEWARE ----------------
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Access Denied. No token provided." });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid Token" });
  }
};

// ---------------- SCHEMAS ----------------
const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
  })
);

const Package = mongoose.model(
  "Package",
  new mongoose.Schema(
    {
      title: String,
      destination: String,
      price: Number,
      description: String,
      image: String,
    },
    { timestamps: true }
  )
);

const Booking = mongoose.model(
  "Booking",
  new mongoose.Schema(
    {
      packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
      },
      customerName: String,
      email: String,
      phone: String,
      travelDate: Date,
      people: Number,
      status: {
        type: String,
        default: "Pending",
      },
    },
    { timestamps: true }
  )
);

const Activity = mongoose.model(
  "Activity",
  new mongoose.Schema(
    {
      name: String,
      location: String,
      price: Number,
      duration: String,
      image: String,
    },
    { timestamps: true }
  )
);

const Gallery = mongoose.model(
  "Gallery",
  new mongoose.Schema(
    {
      title: String,
      image: String,
    },
    { timestamps: true }
  )
);

// ---------------- ADMIN AUTH ----------------
app.post("/api/admin/register", async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);

    const admin = new Admin({
      username: req.body.username,
      password: hashed,
    });

    await admin.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    res.status(400).json({ message: "Registration failed" });
  }
});

app.post("/api/admin/login", async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: req.body.username });

    if (!admin)
      return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(
      req.body.password,
      admin.password
    );

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

// ---------------- PACKAGES ----------------
app.get("/api/packages", async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch packages" });
  }
});

app.post(
  "/api/packages",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const image = req.file ? `/uploads/${req.file.filename}` : "";

      const newPackage = new Package({
        ...req.body,
        image,
      });

      await newPackage.save();

      res.status(201).json({ message: "Package added successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to add package" });
    }
  }
);

// ---------------- BOOKINGS ----------------

// User → Create Booking
app.post("/api/bookings", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json({ message: "Booking placed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Booking failed" });
  }
});



app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "anjanashiju28@gmail.com",  
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
         
      to: "anjanashiju28@gmail.com",     
      replyTo: email,                   
      subject: subject,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Message sent successfully " });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed " });
  }
});




// Admin → View Bookings
app.get("/api/bookings", verifyAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().populate("packageId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// Admin → Update Booking Status
app.put("/api/bookings/:id", verifyAdmin, async (req, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
    });
    res.json({ message: "Booking status updated" });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// DELETE Booking (Admin)
app.delete("/api/bookings/:id", verifyAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});


// ---------------- ACTIVITIES ----------------
app.get("/api/activities", async (req, res) => {
  try {
    const activities = await Activity.find();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch activities" });
  }
});

app.post(
  "/api/activities",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const image = req.file ? `/uploads/${req.file.filename}` : "";

      const activity = new Activity({
        ...req.body,
        image,
      });

      await activity.save();
      res.status(201).json({ message: "Activity added successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to add activity" });
    }
  }
);


// UPDATE Activity (Admin)
app.put(
  "/api/activities/:id",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      let updatedData = { ...req.body };

      if (req.file) {
        updatedData.image = `/uploads/${req.file.filename}`;
      }

      await Activity.findByIdAndUpdate(req.params.id, updatedData);

      res.json({ message: "Activity updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Update failed" });
    }
  }
);





// ---------------- GALLERY ----------------
app.get("/api/gallery", async (req, res) => {
  try {
    const gallery = await Gallery.find();
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch gallery" });
  }
});

app.post(
  "/api/gallery",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const image = req.file ? `/uploads/${req.file.filename}` : "";

      const newImage = new Gallery({
        ...req.body,
        image,
      });

      await newImage.save();
      res.status(201).json({ message: "Image uploaded successfully" });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);
// UPDATE Gallery Image (Admin)
app.put(
  "/api/gallery/:id",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      let updatedData = { ...req.body };

      if (req.file) {
        updatedData.image = `/uploads/${req.file.filename}`;
      }

      await Gallery.findByIdAndUpdate(req.params.id, updatedData);

      res.json({ message: "Image updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Update failed" });
    }
  }
);



// ---------------- UPDATE PACKAGE ----------------
app.put(
  "/api/packages/:id",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      let updatedData = { ...req.body };

      if (req.file) {
        updatedData.image = `/uploads/${req.file.filename}`;
      }

      await Package.findByIdAndUpdate(req.params.id, updatedData);
      res.json({ message: "Package updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Update failed" });
    }
  }
);

// ---------------- DELETE PACKAGE ----------------
app.delete(
  "/api/packages/:id",
  verifyAdmin,
  async (req, res) => {
    try {
      const pkg = await Package.findById(req.params.id);

      if (!pkg)
        return res.status(404).json({ message: "Package not found" });

      // Delete image file also (optional but clean)
      if (pkg.image) {
        const imagePath = path.join(__dirname, pkg.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await Package.findByIdAndDelete(req.params.id);

      res.json({ message: "Package deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Delete failed" });
    }
  }
);

// ---------------- SEARCH PACKAGE BY DESTINATION ----------------
app.get("/api/packages/search", async (req, res) => {
  try {
    const { destination } = req.query;

    if (!destination) {
      return res.status(400).json({ message: "Destination is required" });
    }

    const packages = await Package.find({
      destination: { $regex: destination, $options: "i" }
    }).sort({ createdAt: -1 });

    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
});

// DELETE Activity (Admin)
app.delete("/api/activities/:id", verifyAdmin, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity)
      return res.status(404).json({ message: "Activity not found" });

    // delete image file
    if (activity.image) {
      const imagePath = path.join(__dirname, activity.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Activity.findByIdAndDelete(req.params.id);

    res.json({ message: "Activity deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});


// DELETE Gallery Image (Admin)
app.delete("/api/gallery/:id", verifyAdmin, async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image)
      return res.status(404).json({ message: "Image not found" });

    // delete file
    if (image.image) {
      const imagePath = path.join(__dirname, image.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Gallery.findByIdAndDelete(req.params.id);

    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});


// ---------------- SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
