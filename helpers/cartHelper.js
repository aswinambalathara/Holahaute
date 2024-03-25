const cartSchema = require("../models/cartModel");
const productSchema = require("../models/productModel");
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
              quantity: "$product.quantity",
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
    {
      $lookup: {
        from: "products",
        localField: "cartItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $addFields: {
        total: { $multiply: ["$product.price", "$cartItems.quantity"] },
      },
    },
    {
      $group: {
        _id: "$_id",
        grandTotal: { $sum: "$total" },
        product: {
          $push: {
            quantity: "$cartItems.quantity",
            price: "",
          },
        },
      },
    },
  ]);
  return cart;
};

module.exports.getCheckoutHelper = async (userId) => {
  const cart = await cartSchema.aggregate([
    { $match: { userId: new ObjectId(userId) } },
    { $unwind: "$cartItems" },
    {
      $group: {
        _id: "$cartItems.productId",
        totalQuantityByProduct: { $sum: "$cartItems.quantity" },
        cartItems: { $push: "$cartItems" },
        userId: { $first: "$userId" },
      },
    },
    {
      $addFields: {
        totalQuantityByProduct: {
          productId: "$_id",
          quantity: "$totalQuantityByProduct",
        },
      },
    },
    { $unwind: "$cartItems" },
    {
      $lookup: {
        from: "products",
        localField: "cartItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $addFields: {
        orderTotal: { $multiply: ["$cartItems.quantity", "$product.price"] },
      },
    },
    {
      $group: {
        _id: "$userId",
        grandTotal: { $sum: "$orderTotal" },
        orderInfo: {
          $push: {
            product: {
              productId: "$cartItems.productId",
              size: "$cartItems.size",
              quantity: "$cartItems.quantity",
              orderTotal: "$orderTotal",
              color: "$cartItems.color",
            },
          },
        },
        totalQuantityByProduct: { $addToSet: "$totalQuantityByProduct" },
      },
    },
  ]);
  return cart[0];
};

module.exports.checkProductQuantity = async (totalQuantityByProduct) => {
  for (let item of totalQuantityByProduct) {
    const product = await productSchema.findOne(
      { _id: new ObjectId(item.productId) },
      { _id: 0, quantity: 1, productName: 1 }
    );
    const check = product.quantity - item.quantity;
    if (check >= 0) {
      return true;
    } else {
      return product.productName;
    }
  }
};

module.exports.addCartQuantityCheck = (cart,productId) => {
  const matchingProducts = cart.cartItems.filter((item) =>
    item.productId.equals(productId)
  );

  const totalQuantity = matchingProducts.reduce((acc, item) => {
    return acc + item.quantity;
  }, 0);
  console.log(totalQuantity);

  return totalQuantity;
};
