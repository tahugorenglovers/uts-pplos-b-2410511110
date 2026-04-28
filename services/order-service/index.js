require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Order = require('./models/Order');

const app = express();
app.use(express.json());

// connect MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"));

// middleware auth
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(403).json({ message: "Invalid token" });
    }
};

app.post('/orders', authMiddleware, async (req, res) => {
    try {
        const { event_id, tickets } = req.body;

        // ambil data event dari Event Service
        const eventRes = await axios.get(
            `${process.env.EVENT_SERVICE_URL}/events/${event_id}`
        );

        const event = eventRes.data;

        // hitung total
        let total = 0;
        tickets.forEach(t => {
            total += t.price * t.quantity;
        });

        const order = await Order.create({
            user_email: req.user.email,
            event_id,
            tickets,
            total
        });

        res.status(201).json({
            message: "Order created",
            order
        });

    } catch (err) {
        res.status(500).json({
            message: "Error creating order",
            error: err.message
        });
    }
});

app.get('/orders', authMiddleware, async (req, res) => {
    const orders = await Order.find({ user_email: req.user.email });
    res.json(orders);
});