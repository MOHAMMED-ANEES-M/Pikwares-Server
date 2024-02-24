const mongoose=require('mongoose')


const menSchema = mongoose.Schema({

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
      deliverycharge: {
        type: String,
        maxlength: 10,
        required: true,
      },
      stock: {
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

})


const Men = mongoose.model('Men',menSchema,'MenProducts');


module.exports=Men