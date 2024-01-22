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
        ref:'Headsets',
        required: true,
        index: false,
    },
    statusDate: {
        type: Date,
        default: Date.now,
    },
})

ordersSchema.pre('save', function (next) {
    this.statusDate = new Date();
    next();
});

const Orders = mongoose.model('Orders',ordersSchema,'Orders')
module.exports = Orders