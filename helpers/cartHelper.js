const cartSchema = require("../models/cartModel");
const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");

module.exports.getCartHelper = async (userId) => {
  const cart = await cartSchema.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: "$cartItems" },
    {
      $lookup: {
        from: "products",
        localField: "cartItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $addFields: {
        total: { $multiply: ["$cartItems.quantity", "$product.price"] },
      },
    },
    {
      $group: {
        _id: "$_id",
        grandTotal: { $sum: "$total" },
        userId: { $first: "$userId" },
        cartItems: {
          $push: {
            _id: "$cartItems._id",
            productId: "$cartItems.productId",
            quantity: "$cartItems.quantity",
            totalPrice: "$total",
            color: "$cartItems.color",
            size: "$cartItems.size",
            Products: {
              _id: "$product._id",
              productName: "$product.productName",
              price: "$product.price",
              images: "$product.images",
            },
          },
        },
      },
    },
  ]);

  return cart;
};

module.exports.updateQuantityHelper = async (userId, itemId) => {
  const cart = await cartSchema.aggregate([
    { $match: { userId: new ObjectId(userId) } },
    { $unwind: "$cartItems" },
    { $match: { "cartItems._id": new ObjectId(itemId) } },
    {
      $lookup: {
        from: "products",
        localField: "cartItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
  ]);

  return cart;
};

module.exports.getCheckoutHelper = async (userId) =>{
  const cart = await cartSchema.aggregate([
    {$match : {userId : new ObjectId(userId)}},
    {$unwind : "$cartItems"},
    {$lookup:{
      from : 'products',
      localField : "cartItems.productId", 
      foreignField : "_id",
      as : 'product'
    }},
    {$unwind : "$product"},
    {
      $addFields:{
        total : {
          $multiply : ["$cartItems.quantity","$product.price"]
        }
      }
    },
    {$group : {_id:"$_id",grandTotal : {$sum : "$total"}}}
  ])
  return cart
}
