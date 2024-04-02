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
  minimumPurchaseAmount: {
    type: Number,
    required: true,
  },
  maximumDiscount: {
    type: Number,
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },

  isExpired: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("coupon", couponSchema);
