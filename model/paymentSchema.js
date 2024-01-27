const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    razorId: {
        type: String,
        required: true,
    },
    paymentId: {
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
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const Payment = mongoose.model('Payment', paymentSchema,'Payments');

module.exports = Payment;
