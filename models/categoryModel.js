const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const categorySchema = Schema({
  categoryName: {
    type: String,
    required: true,
  },

  status: {
    type: Boolean,
    required: true,
    default: true,
  },

  image: {
    type: String,
    required: true,
  },
  soldProducts: {
    type: Number,
    required: true,
    default: 0,
  },
  totalSales: {
    type: Number,
    required: true,
    default: 0,
  },
});

module.exports = mongoose.model("category", categorySchema);
