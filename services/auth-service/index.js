const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

const users = [];

const SECRET = "secretkey";

// untuk register
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    users.push({ email, password: hashed });

    res.status(201).json({ message: "User created" });
});

// untuk login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign({ email }, SECRET, { expiresIn: "15m" });

    res.json({ access_token: token });
});

//add jwt middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(403).json({ message: "Invalid token" });
    }
};

app.get('/profile', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

let refreshTokens = [];

app.post('/refresh', (req, res) => {
    const { token } = req.body;

    if (!refreshTokens.includes(token)) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }

    const user = jwt.verify(token, SECRET);
    //expire dalam 15 menit
    const newAccessToken = jwt.sign({ email: user.email }, SECRET, { expiresIn: "15m" });

    res.json({ access_token: newAccessToken });
});

app.listen(3001, () => console.log("Service auth (index.js) running"));