const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = Schema({
  productName: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  images: {
    type: Array,
    required: true,
  },

  userType: {
    type: String,
    required: true,
  },

  color: {
    type: Array,
    required: true,
  },

  sizeOptions: {
    type: Array,
    required: true,
  },

  offer:{
    offerPrice :{
      type : Number
    },
    offerId:{
      type: mongoose.Schema.Types.ObjectId
    },
  },

  additionalInformation: {
    type: String,
    default: "nil",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("product", productSchema);
