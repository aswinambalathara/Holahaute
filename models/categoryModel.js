const mongoose = require( 'mongoose' )

const Schema = mongoose.Schema

const categorySchema = Schema({
    categoryName: {
        type : String, 
        required : true 
    },

    status : {
        type : Boolean,
        required : true,
        default : true
    },

    image : {
        type : String,
        required :true 
    },

    // offer : {
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : 'offer'
    // }
})


module.exports = mongoose.model( 'category', categorySchema )