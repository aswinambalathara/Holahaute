const { default: mongoose } = require("mongoose");
const cartSchema = require("../models/cartModel");
const productSchema = require("../models/productModel");
const { ObjectId } = require("mongodb");

module.exports.getCart = async (req, res) => {
  try {
    res.render("shop/cart.ejs", {
      title: "Cart",
      user: req.session.userAuth,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.addToCart = async (req, res) => {
  try {
    const userId = req.session.userAuthId;
    const productId = req.params.id;
    const quantity = await productSchema.findOne(
      { _id: productId },
      { quantity: 1, _id: 0 }
    );
    const stockQuantity = quantity.quantity;

    const { color, size } = req.body;
    const cart = await cartSchema.findOne({ userId: userId });
    if (cart) {
      //if cart exists
      const exist = cart.cartItems.find((item) => {
        return (
          item.productId.equals(productId) &&
          item.color === color &&
          item.size === size
        );
      });
      if (exist) {
        const availableQuantity = stockQuantity - exist.quantity;
        if (availableQuantity > 0) {
          if (exist.quantity < 5) {
            await cartSchema.updateOne(
              {
                userId: userId,
                "cartItems.productId": exist.productId,
                "cartItems.color": exist.color,
                "cartItems.size": exist.size,
              },
              { $inc: { 'cartItems.$.quantity': 1 } }
            );
            res.json({
              status: true,
              message: "Added to cart",
            });
          } else {
            res.json({
              status: false,
              message: "Maximum buying quantity reached",
            });
          }
        } else {
          res.json({
            status: false,
            message: "outofstock",
          });
        }
      } else {
        // if product doesn't exist
        await cartSchema.updateOne(
          { userId: userId },
          {
            $push: {
              cartItems: {
                productId: productId,
                color: color,
                size: size,
              },
            },
          }
        );
        req.session.productCount++;
        res.json({
          status: true,
          message: "Added to cart",
        });
      }
    } else {
      // if cart doesn't exist
      const newCart = new cartSchema({
        userId: userId,
        cartItems: [{ productId: productId, color: color, size: size }],
      });
      await newCart.save();
      req.session.productCount = 1;
      res.json({
        status: true,
        message: "Added To Cart",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
