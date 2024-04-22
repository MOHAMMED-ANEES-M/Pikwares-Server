const mongoose=require('mongoose')


const messageSchema = mongoose.Schema({

    room : {
        type : String,
    },
    
    customerId: {
        type: String,
    },
    message: {
        type: String,
    },
    role: { 
        type: String, 
        required: true 
    },
    timestamb: {
        type: Date,
        default: Date.now,
    },
      
})


const Message = mongoose.model('Message',messageSchema,'Messages');


module.exports=Message