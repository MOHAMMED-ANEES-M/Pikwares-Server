const mongoose=require('mongoose')


const wishlistSchema = mongoose.Schema({

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
      productactualprice: {
        type: String,
        maxlength: 10,
        required: true,
      },
    productcategory: {
        type: String,
        required: true,
      },
    productdescription: {
        type: String,
        minlength: 3,
        required: true,
      },
    images: {
        type: [String],
        required: true,
      },
    customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true
      }, 
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      count: {
        type: Number,
        length:1,
        default:1,
      },
      
})


const Wishlist = mongoose.model('Wishlist',wishlistSchema,'Wishlist');


module.exports=Wishlist