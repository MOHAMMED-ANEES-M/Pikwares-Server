const mongoose=require('mongoose')


const headsetsSchema = mongoose.Schema({

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


const Headsets = mongoose.model('Headsets',headsetsSchema,'HeadsetProducts');


module.exports=Headsets