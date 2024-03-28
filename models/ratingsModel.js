const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ratingsSchema = Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },

  createdAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },

  review: {
    type: String,
  },
});

module.exports = mongoose.model("ratings", ratingsSchema);
