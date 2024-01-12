const mongoose=require('mongoose')


const mobilesSchema = mongoose.Schema({

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


const Mobiles = mongoose.model('Mobiles',mobilesSchema,'MobileProducts');


module.exports=Mobiles