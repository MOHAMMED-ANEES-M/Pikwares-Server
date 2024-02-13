const mongoose = require ('mongoose')

const ordersSchema = mongoose.Schema({
    orderStatus: {
        type: String,
        required:true,
    },
    customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true
    }, 
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: false,
    },
    count: {
        type: Number,
        required: true,
        index: false,
    },
    razorId: {
        type: String,
        ref: 'Payment', 
    },
    paymentId: {
        type: String,
        ref: 'Payment', 
    },
    mode:{
        type: String,
        required:true,
    },
    statusDate: {
        type: Date,
        default: Date.now,
    },
    productname : {
        type : String,
        minlength: 2,
        required : true,
    },
     productprice: {
        type: String,
        maxlength: 10,
        required: true,
    },
    images: {
        type: [String],
        required: true,
    },
})

ordersSchema.pre('save', function (next) {
    this.statusDate = new Date();
    next();
});

const Orders = mongoose.model('Orders',ordersSchema,'Orders')
module.exports = Orders