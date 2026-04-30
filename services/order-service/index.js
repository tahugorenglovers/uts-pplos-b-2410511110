require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const Order = require('./models/Order');

const app = express();
app.use(express.json());


// cek mongodb connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("Mongo error:", err));


// logging
app.use((req, res, next) => {
    console.log("ORDER HIT:", req.method, req.url);
    next();
});


// auth middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ message: "Invalid token" });
    }
};


// create order
app.post('/', authMiddleware, async (req, res) => {
    try {
        const { event_id, tickets } = req.body;

        if (!event_id || !tickets || tickets.length === 0) {
            return res.status(400).json({ message: "event_id and tickets required" });
        }

        // ambil event dari event-service
        const eventRes = await axios.get(
            `${process.env.EVENT_SERVICE_URL}/api/events/${event_id}`
        );

        const event = eventRes.data;

        let total = 0;
        let detailedTickets = [];

        tickets.forEach(t => {
            const ticketData = event.tickets.find(
                tc => tc.id === t.ticket_category_id
            );

            if (!ticketData) {
                throw new Error("Ticket category not found");
            }

            total += ticketData.price * t.quantity;

            detailedTickets.push({
                ticket_category_id: ticketData.id,
                name: ticketData.name,
                price: ticketData.price,
                quantity: t.quantity
            });
        });

        // generate ticket code & QR
        const ticketCode = "TICKET-" + Date.now();
        const qrCode = await QRCode.toDataURL(ticketCode);

        const order = await Order.create({
            user_email: req.user.email,
            event_id,
            tickets: detailedTickets,
            total,
            ticket_code: ticketCode,
            qr_code: qrCode
        });

        res.status(201).json({
            message: "Order created",
            order
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Error creating order",
            error: err.message
        });
    }
});


//get order
app.get('/', authMiddleware, async (req, res) => {
    const orders = await Order.find({ user_email: req.user.email });
    res.json(orders);
});


// validasi tiket
app.post('/validate-ticket', async (req, res) => {
    const { ticket_code } = req.body;

    const order = await Order.findOne({ ticket_code });

    if (!order) {
        return res.status(404).json({ message: "Invalid ticket" });
    }

    if (order.is_used) {
        return res.status(400).json({ message: "Ticket already used" });
    }

    order.is_used = true;
    await order.save();

    res.json({ message: "Ticket valid" });
});


//start server
app.listen(process.env.PORT, () => {
    console.log(`Order Service running on port ${process.env.PORT}`);
});