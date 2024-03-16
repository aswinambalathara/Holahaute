const cartSchema = require("../models/cartModel");
const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");
const productSchema = require("../models/productModel");

module.exports.makeOrderHelper = async (userId) => {
  const order = await cartSchema.aggregate([
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

  return order[0];
};

module.exports.checkProductQuantity = async (totalQuantityByProduct) => {
  for (let item of totalQuantityByProduct) {
    const product = await productSchema.findOne(
      { _id: new ObjectId(item.productId) },
      { _id: 0, quantity: 1, productName: 1 }
    );
    const check = product.quantity - item.quantity;
    if (check > 0) {
      return true;
    } else {
      return product.productName;
    }
  }
};

module.exports.decreaseProductQuantity = async (totalQuantityByProduct) => {
const updates = totalQuantityByProduct.map((item)=>({
    updateOne : {
        filter : {_id : new ObjectId(item.productId)},
        update : {$inc : {quantity : -Number(item.quantity)}}
    }
}));

const result = await productSchema.bulkWrite(updates);

if(result.modifiedCount === totalQuantityByProduct.length){
    return true;
}else{
    console.log(error);
}
};
