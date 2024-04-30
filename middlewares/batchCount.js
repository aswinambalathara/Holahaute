const jwt = require("jsonwebtoken");
const cartSchema = require("../models/cartModel");
const wishlistSchema = require("../models/wishlistModel");

module.exports.updateBatchCount = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const cartCount = req.session.cartCount;
      const wishlistCount = req.session.wishlistCount;
      if (cartCount === undefined || wishlistCount === undefined) {
        console.log("hi");
        const user = jwt.verify(token, process.env.JWT_SECRET);
        const cart = await cartSchema.findOne({ userId: user.userId });
        const wishlist = await wishlistSchema.findOne({ userId: user.userId });
        req.session.cartCount = cart ? cart.cartItems.length : 0;
        req.session.wishlistCount = wishlist
          ? wishlist.wishlistItems.length
          : 0;
      }
    }
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};
