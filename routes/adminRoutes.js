// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const Admin = require('../models/Admin');

// const SECRET_KEY = "mysecretkey";

// // Admin Register
// router.post('/register', async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         let admin = await Admin.findOne({ username });
//         if (admin) return res.status(400).json({ msg: "Admin already exists" });

//         admin = new Admin({ username, password });
//         const salt = await bcrypt.genSalt(10);
//         admin.password = await bcrypt.hash(password, salt);
//         await admin.save();
//         res.json({ msg: "Admin registered successfully" });
//     } catch (err) {
//         res.status(500).send("Server Error");
//     }
// });

// // Admin Login
// router.post('/login', async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         const admin = await Admin.findOne({ username });
//         if (!admin) return res.status(400).json({ msg: "Invalid Credentials" });

//         const isMatch = await bcrypt.compare(password, admin.password);
//         if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

//        const token = jwt.sign(
//   { id: admin._id },
//   process.env.JWT_SECRET,
//   { expiresIn: "1h" }
// );
//     } catch (err) {
//         res.status(500).send("Server Error");
//     }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const SECRET_KEY = "mysecretkey";

// Admin Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        let admin = await Admin.findOne({ username });
        if (admin) return res.status(400).json({ msg: "Admin already exists" });

        admin = new Admin({ username, password });
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);
        await admin.save();
        res.json({ msg: "Admin registered successfully" });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

//  Admin Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(400).json({ msg: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        const token = jwt.sign(
            { id: admin._id },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.json({ token });  

    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;