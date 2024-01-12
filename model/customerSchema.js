const mongoose=require('mongoose')
const { isEmail } = require('validator');



const customerSchema = mongoose.Schema({

    email : {
        unique : true,
        type : String,
        minlength : 3,
        required : true,
        validate: {
            validator: value => isEmail(value),
            message: 'Invalid email address',
        },
    },
    password : {
        type : String,
        minlength : 4,
        maxlength : 8,
        required : true,
    },
    firstname: {
        type: String,
        minlength: 3,
        maxlength : 15,
        required: true,
      },
      lastname: {
        type: String,
        minlength: 3,
        maxlength : 15,
        required: true,
      },
      number: {
        type: Number,
        min: 1000000000,
        max: 9999999999,
        required: true,
      },

})


const Customer = mongoose.model('Customer',customerSchema,'customers');


module.exports=Customer