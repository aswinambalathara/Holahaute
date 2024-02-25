const mongoose = require('mongoose')

const Schema = mongoose.Schema
const addressSchema = Schema({
    fullName: {
        type : String,
        required : true
    },

    mobile : {
        type : Number,
        required : true
    },

    // landmark :{
    //     type : String,
    //     required : true
    // },

    // street : {
    //     type : String,
    //     required : true
    // },

    address : {
        type : String,
        required : true
    },

    district : {
        type : String,
        required : true
    },

    pincode : {
        type : Number,
        required : true
    },

    state : {
        type : String,
        required : true
    },

    // country : {
    //     type : String,
    //     requred : true
    // },

    status : {
        type : Boolean,
        default : true,
        required : true
    },

    userId : {
        type : mongoose.Schema.Types.ObjectId,
        required : true
    },

    isPrimary :{
        type : Boolean,
        default : false
    }
})

module.exports = mongoose.model('addresses',addressSchema);