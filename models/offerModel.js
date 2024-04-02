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
  offerType: {
    type: String,
    required: true,
    enum : ['categoryOffer','productOffer']
  },
  
});

module.exports = mongoose.model("offer", categorySchema);
