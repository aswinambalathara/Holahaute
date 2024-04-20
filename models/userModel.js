const mongoose = require('mongoose')

const Schema = mongoose.Schema
const userSchema = Schema({
    fullName:{
        type : String,
        required : true,
    },
    email: {
        type: String,
        required : true,
        unique : true
    },
    phone:{
        type: String,
        required: true
    },
    password:{
        type:String,
        required: true
    },
    addresses: [{
        type : mongoose.Types.ObjectId,
        ref : "address" 
    }],
    isBlocked:{
        type : Boolean,
        default: false
    },
    joinedDate:{
        type: Date,
        default: Date.now
    },
    isVerified:{
        type : Boolean,
        default: false
    },
    
    token:{
        otp:{
            type:String
        },
        generatedTime:{
            type:Date
        }
    },

    referralCode :{
        type : String,
        required : true,
        default : "null"
    }
})

module.exports = mongoose.model('user',userSchema)