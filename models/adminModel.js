const mongoose = require('mongoose')

const Schema = mongoose.Schema
const adminSchema = Schema({
    fullName:{
        type : String,
        required : true,
    },
    email: {
        type: String,
        required : true,
        unique : true
    },
    password: {
        type :String,
        required :true,
    },
    isAdmin:{
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('admin',adminSchema)