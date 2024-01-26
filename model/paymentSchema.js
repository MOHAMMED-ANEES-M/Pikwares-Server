const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    // Add more fields as needed
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const Payment = mongoose.model('Payment', paymentSchema,'Payments');

module.exports = Payment;
