const mongoose=require('mongoose')


const cartSchema = mongoose.Schema({

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
        unique : true,
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      
})


const Cart = mongoose.model('Cart',cartSchema,'Cart');


module.exports=Cart