const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const walletSchema = Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  history: [
    {
      paymentType: {
        type: String,
        enum: ["Deposit", "Withdrawal"],
        required: true,
      },
      paymentId :{
        type : String,
        required : true,
        default : null
      },
      amount: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        required: true,
        default: Date.now(),
      },
      currentBalance :{
        type : String,
        required : true,
      },
      remarks:{
        type: String
      }
    },
  ],
});

module.exports = mongoose.model("wallet", walletSchema);
