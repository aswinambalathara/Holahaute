const mongoose = require('mongoose');

const Schema = mongoose.Schema
const cartSchema = Schema({
    userId :{
        type : mongoose.Schema.Types.ObjectId,
        required : true
    },

    cartItems :[{
        productId:{
            type : mongoose.Schema.Types.ObjectId,
            ref : 'products',
            required : true
        },

        quantity : {
            type : Number,
            required : true,
            default : 1
        }
    }]
})