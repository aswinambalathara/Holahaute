const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const offerSchema = Schema({
  offerName: {
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
  discount: {
    type: Number,
    required: true,
  },
  offerType: {
    type: String,
    required: true,
    enum: ["categoryOffer", "productOffer"],
  },
  offerItems: [mongoose.Schema.Types.ObjectId],
  isExpired: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("offer", offerSchema);
