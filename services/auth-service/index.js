require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();
app.use(express.json());

const SECRET = process.env.JWT_SECRET || "secretkey";

// dummy DB untuk testing sementara
const users = [];
const refreshTokens = [];

//session untuk oauth & google oauth strategy
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
    callbackURL: "/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// middleware jwt 
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

    if (!email || !password) {
        return res.status(400).json({ message: "Email & password needed" });
    }

    const existing = users.find(u => u.email === email);
    if (existing) {
        return res.status(409).json({ message: "This user already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    users.push({ email, password: hashed });

    res.status(201).json({ message: "User created" });
});

// login with jwt
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: "User not found" });

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

// refresh jwt token
app.post('/refresh', (req, res) => {
    const { token } = req.body;

    if (!token || !refreshTokens.includes(token)) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }

    try {
        const user = jwt.verify(token, SECRET);

        const newAccessToken = jwt.sign(
            { email: user.email },
            SECRET,
            { expiresIn: "15m" }
        );

        res.json({ access_token: newAccessToken });

    } catch {
        return res.status(403).json({ message: "Expired token" });
    }
});

// logout
app.post('/logout', (req, res) => {
    const { token } = req.body;

    const index = refreshTokens.indexOf(token);
    if (index > -1) refreshTokens.splice(index, 1);

    res.json({ message: "Logged out" });
});

// Protected route for oauth
app.get('/profile', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

// Google login
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        const email = req.user.emails[0].value;
        const name = req.user.displayName;

        let user = users.find(u => u.email === email);

        if (!user) {
            user = { email, name, oauth: true };
            users.push(user);
        }

        const accessToken = jwt.sign({ email }, SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ email }, SECRET, { expiresIn: "7d" });

        refreshTokens.push(refreshToken);

        res.json({
            access_token: accessToken,
            refresh_token: refreshToken
        });
    }
);

// Server running
app.listen(3001, () => {
    console.log("Auth service running on http://localhost:3001");
});