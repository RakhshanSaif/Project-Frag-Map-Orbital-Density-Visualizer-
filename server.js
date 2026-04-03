const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");
const https = require("https");  // ← ADDED THIS

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

mongoose.connect("mongodb://127.0.0.1:27017/fragmapDB")
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err));

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true },
    password: { type: String, required: true },
    type:     { type: String, default: "public" },
    createdAt:{ type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

const reportSchema = new mongoose.Schema({
    username:  String,
    timestamp: { type: Date, default: Date.now },
    low:       Number,
    medium:    Number,
    high:      Number
});
const Report = mongoose.model("Report", reportSchema);

// ✅ REAL-TIME TLE DATA ROUTE — ADDED THIS
app.get("/tledata", (req, res) => {
    console.log("📡 Fetching live TLE data from CelesTrak...");
    https.get("https://celestrak.org/SOCRATES/query.php?GROUP=debris&FORMAT=JSON", (response) => {
        let data = "";
        response.on("data", chunk => data += chunk);
        response.on("end", () => {
            try {
                const parsed = JSON.parse(data);
                console.log("✅ Got " + parsed.length + " live objects");
                res.json(parsed);
            } catch(e) {
                console.log("❌ Parse failed, sending empty array");
                res.json([]);
            }
        });
    }).on("error", err => {
        console.log("❌ CelesTrak fetch error:", err.message);
        res.json([]);
    });
});

app.post("/signup", async (req, res) => {
    try {
        const { username, email, password, type } = req.body;
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ message: "❌ Username already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword, type });
        await user.save();
        res.json({ message: "✅ Account created successfully" });
    } catch (err) {
        res.status(500).json({ message: "❌ Server error: " + err.message });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "❌ User not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "❌ Wrong password" });
        }
        res.json({ message: "✅ Login successful", username: user.username, type: user.type });
    } catch (err) {
        res.status(500).json({ message: "❌ Server error: " + err.message });
    }
});

app.post("/report", async (req, res) => {
    try {
        const { username, low, medium, high } = req.body;
        const report = new Report({ username, low, medium, high });
        await report.save();
        res.json({ message: "✅ Report saved" });
    } catch (err) {
        res.status(500).json({ message: "❌ Error: " + err.message });
    }
});

app.get("/reports/:username", async (req, res) => {
    try {
        const reports = await Report.find({ username: req.params.username }).sort({ timestamp: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: "❌ Error: " + err.message });
    }
});

app.listen(3000, () => {
    console.log("✅ Server running on http://localhost:3000");
    console.log("✅ Open http://localhost:3000/login.html");
});
