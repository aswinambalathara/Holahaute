const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bannerSchema = Schema({
    
  name: {
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

  status: {
    type: Boolean,
    required: true,
    default: true,
  },

  bannerImage : {
    type : String,
    required : true
  },

  targetURL : {
    type : String,
    required : true
  }

});

module.exports = mongoose.model("banner", bannerSchema);
