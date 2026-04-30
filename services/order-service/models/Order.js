const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user_email: String,
    event_id: Number,

    tickets: [
        {
            ticket_category_id: Number,
            name: String,
            price: Number,
            quantity: Number
        }
    ],

    total: Number,

    ticket_code: String,
    qr_code: String,

    is_used: {
        type: Boolean,
        default: false
    },

    status: {
        type: String,
        default: "pending"
    }

}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);