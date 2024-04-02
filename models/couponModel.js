const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const couponSchema = Schema({
  couponName: {
    type: String,
    required: true,
  },

  couponCode: {
    type: String,
    required: true,
  },

  validFrom: {
    type: Date,
    required: true,
  },

  validTo: {
    type: Date,
    required: true,
  },

  validFor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "category",
  },
  minimumAmount: {
    type: Number,
    required: true,
  },
  MaximumDiscount: {
    type: Number,
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
});

module.exports = mongoose.model("coupon", couponSchema);
