const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const orderSchema = Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    default: true,
  },

  addressId: {
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

  estimatedArrival: {
    type: Date,
    required: true,
    default: Date.now() + 7 * 24 * 60 * 60 * 1000,
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
        ref: "product",
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
    },
  ],

  grandTotal: {
    type: Number,
    required: true,
  },

  paymentMethod: {
    method: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
    }
  },

  cancelReason: {
    type: String,
  },
});

module.exports = mongoose.model("order", orderSchema);
