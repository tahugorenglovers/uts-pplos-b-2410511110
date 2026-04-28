const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user_email: String,
    event_id: Number,
    tickets: [
        {
            name: String,
            price: Number,
            quantity: Number
        }
    ],
    total: Number,
    status: {
        type: String,
        default: "pending"
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);