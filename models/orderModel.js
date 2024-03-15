const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const orderSchema = Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    default: true,
  },

  address: {
    type: mongoose.Schema.Types.ObjectId,
    default: true,
  },

  orderId: {
    type: String,
    default: true,
  },

  orderedAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },

  updatedAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },

  orderStage: {
    type: String,
    required: true,
    default: "PREPARING FOR DISPATCH",
  },

  orderStatus: {
    type: String,
    required: true,
  },

  products: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        required: true,
      },

      size: {
        type: String,
        required: true,
      },

      color: {
        type: String,
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
      },

      orderTotal: {
        type: Number,
        required: true,
      },
    },
  ],

  grandTotal: {
    type: Number,
    required: true,
  },

  paymentMethod: {
    type: String,
    required: true,
  },

  cancelReason: {
    type: String,
  },
});

module.exports = mongoose.model("order", orderSchema);
