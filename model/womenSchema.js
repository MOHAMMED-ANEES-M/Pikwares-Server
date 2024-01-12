const mongoose=require('mongoose')


const womenSchema = mongoose.Schema({

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

})


const Women = mongoose.model('Women',womenSchema,'WomenProducts');


module.exports=Women