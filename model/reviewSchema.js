const mongoose = require ('mongoose')

const reviewSchema = mongoose.Schema({

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
    rating: {
        type: Number,
        required: true, 
    },
    review:{
        type: String,
        required:true,
        minlength: 5,
    },
    reviewDate: {
        type: Date,
        default: Date.now,
    },
})

reviewSchema.pre('save', function (next) {
    this.statusDate = new Date();
    next();
});

const Review = mongoose.model('Review',reviewSchema,'Reviews')
module.exports = Review