const { default: mongoose } = require("mongoose");
const cartSchema = require("../models/cartModel");
const productSchema = require("../models/productModel");
const addressSchema = require('../models/addressModel');
const cartHelper = require("../helpers/cartHelper");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

module.exports.getCart = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const userId = authUser.userId;
    const cart = await cartHelper.getCartHelper(userId);
    console.log(cart[0])
    //console.log(cart[0].cartItems[0])
    res.render("shop/cart.ejs", {
      title: "Cart",
      user: authUser.userName,
      cartData: cart[0],
      error : req.flash('error')
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doAddToCart = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const userId = authUser.userId;
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
              { $inc: { "cartItems.$[itemRef].quantity": 1 } },
              { arrayFilters: [{ "itemRef._id": exist._id }] }
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
            stock: false,
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

module.exports.doUpdateQuantity = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const { quantity, itemId } = req.body;
    const cart = await cartHelper.updateQuantityHelper(authUser.userId, itemId);
    const quantityCheck = cart[0].product.quantity - quantity;
    if (quantityCheck >= 0) {
      const update = await cartSchema.updateOne(
        { userId: authUser.userId, "cartItems._id": new ObjectId(itemId) },
        {
          $set: { "cartItems.$.quantity": quantity },
        }
      );
      if (update) {
        res.json({
          status: true,
        });
      }
    } else {
      res.json({
        status: false,
        message: `Only ${cart[0].product.quantity} left`,
      });
    }
    //console.log(cart)
  } catch (error) {
    console.log(error);
  }
};

module.exports.doRemoveItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const remove = await cartSchema.updateOne(
      { userId: authUser.userId },
      { $pull: { cartItems: { _id: new ObjectId(itemId) } } }
    );
    if (remove) {
      res.json({
        status: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getCartCheckOut = async (req,res)=>{
try {
  const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
  const addresses = await addressSchema.find({userId : new ObjectId(authUser.userId),status:true});
  const cart = await cartHelper.getCheckoutHelper(authUser.userId)
  //console.log(cart.totalQuantityByProduct)
  const stock = await cartHelper.checkProductQuantity(cart.totalQuantityByProduct);
  //console.log(stock)
  //console.log(quantityCheck)
  if(stock === true){
    res.render("shop/checkout.ejs", {
      title: "Checkout",
      user: authUser.userName,
      grandTotal:cart.grandTotal,
      addresses
    });
  }else{
    req.flash('error',`${stock.toUpperCase()} * is not available at this quantity,Try different Quantity`);
   res.redirect('/cart')
  }
  
} catch (error) {
  console.log(error)
}
}

