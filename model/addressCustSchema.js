const mongoose=require('mongoose')


const customerSchema = mongoose.Schema({

    landmark : {
        type : String,
        minlength : 10,
        required : true,
    },
    address : {
      type : String,
      minlength : 10,
      required : true,
    },
    city: {
        type: String,
        minlength: 3,
        maxlength: 15,
        required: true,
      },
      district: {
        type: String,
        minlength: 3,
        maxlength: 15,
        required: true,
      },
      state: {
        type: String,
        minlength: 3,
        maxlength: 15,
        required: true,
      },
      pincode: {
        type: Number,
        length: 6,
        required: true,
      },
      customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true
      }, 

})


const AddressCust = mongoose.model('AddressCust',customerSchema,'customersAddress');


module.exports=AddressCust