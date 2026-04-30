require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const mongoose = require('mongoose');

const User = require('./models/User');

const app = express();
app.use(express.json());

const SECRET = process.env.JWT_SECRET || "secretkey";
const refreshTokens = [];


//cek koneksi mongodb
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
        console.log("DB:", mongoose.connection.name);
    })
    .catch(err => console.log("Mongo error:", err));


app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));


// JWT Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ message: "Invalid token" });
    }
};


// register
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(409).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
        email,
        password: hashed,
        oauth_provider: null
    });

    res.status(201).json({ message: "User created" });
});


// login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password) {
        return res.status(400).json({ message: "Use Google login for this account" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Incorrect password" });

    const accessToken = jwt.sign({ email }, SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ email }, SECRET, { expiresIn: "7d" });

    refreshTokens.push(refreshToken);

    res.json({
        access_token: accessToken,
        refresh_token: refreshToken
    });
});


// google login
app.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);


//google callback
app.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    async (req, res) => {

        console.log("Google callback hit");

        try {
            const email = req.user.emails[0].value;
            const name = req.user.displayName;
            const photo = req.user.photos[0].value;

            console.log("Email:", email);

            let user = await User.findOne({ email });

            if (!user) {
                console.log("Creating new OAuth user");
                user = await User.create({
                    email,
                    name,
                    photo,
                    oauth_provider: "google"
                });
            } else {
                console.log("User already exists");
            }

            const accessToken = jwt.sign({ email }, SECRET, { expiresIn: "15m" });
            const refreshToken = jwt.sign({ email }, SECRET, { expiresIn: "7d" });

            refreshTokens.push(refreshToken);

            res.json({
                access_token: accessToken,
                refresh_token: refreshToken,
                user
            });

        } catch (err) {
            console.error("❌ OAuth Error:", err);
            res.status(500).json({ message: "OAuth failed", error: err.message });
        }
    }
);


// profile
app.get('/profile', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});


// server
app.listen(3001, () => {
    console.log("Auth service running on http://localhost:3001");
});