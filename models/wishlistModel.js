const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const wishlistSchema = Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  wishlistItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("wishlist", wishlistSchema);
