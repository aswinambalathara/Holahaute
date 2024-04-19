const cartSchema = require("../models/cartModel");
const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");
const productSchema = require("../models/productModel");
const orderSchema = require("../models/orderModel");

const today = new Date();

module.exports.makeOrderHelper = async (userId) => {
  try {
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
        $project: {
          cartItems: 1,
          totalQuantityByProduct:1,
          userId: "$userId",
          product: { $mergeObjects: ["$$ROOT.product", "$product.offer"] },
        },
      },
      {
        $lookup: {
          from: "offers",
          localField: "product.offerId",
          foreignField: "_id",
          as: "availableOffer",
        },
      },
      {
        $addFields: {
          offerExist: { $ne: ["$availableOffer", []] },
        },
      },
      {
        $unwind: {
          path: "$availableOffer",
          preserveNullAndEmptyArrays: Boolean("$offerExist"),
        },
      },
      {
        $addFields: {
          offerStatus: {
            $cond: {
              if: { $eq: ["$offer", null] },
              then: false,
              else: {
                $cond: {
                  if: { $gte: ["$availableOffer.validTo", today] },
                  then: true,
                  else: false,
                },
              },
            },
          },
        },
      },
      {
        $project: {
          cartItems: 1,
          userId: "$userId",
          product: 1,
          offerStatus: 1,
          totalQuantityByProduct :1,
          offer: {
            $cond: {
              if: { $eq: ["$offerStatus", true] },
              then: {
                currentPrice: "$product.offerPrice",
                discount: "$availableOffer.discount",
              },
              else: { currentPrice: "$product.price" },
            },
          },
        },
      },
      {
        $addFields: {
          orderTotal: {
            $multiply: ["$cartItems.quantity", "$offer.currentPrice"],
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          subTotal: { $sum: "$orderTotal" },

          orderInfo: {
            $push: {
              product: {
                productId: "$cartItems.productId",
                size: "$cartItems.size",
                quantity: "$cartItems.quantity",
                color: "$cartItems.color",
                price: "$offer.currentPrice",
                actualPrice: "$product.price",
                offerStatus: "$offerStatus",
              },
            },
          },
          totalQuantityByProduct: { $addToSet: "$totalQuantityByProduct" },
        },
      },
    ]);
    console.log(order[0]);
    return order[0];
  } catch (error) {
    console.log(error);
  }
};

module.exports.checkProductQuantity = async (totalQuantityByProduct) => {
  try {
    for (let item of totalQuantityByProduct) {
      const product = await productSchema.findOne(
        { _id: new ObjectId(item.productId) },
        { _id: 0, quantity: 1, productName: 1 }
      );
      const check = (await product.quantity) - item.quantity;
      if (check >= 0) {
        return true;
      } else {
        return product.productName;
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.decreaseProductQuantity = async (totalQuantityByProduct) => {
  try {
    const updates = totalQuantityByProduct.map((item) => ({
      updateOne: {
        filter: { _id: new ObjectId(item.productId) },
        update: { $inc: { quantity: -Number(item.quantity) } },
      },
    }));

    const result = await productSchema.bulkWrite(updates);

    if (result.modifiedCount === totalQuantityByProduct.length) {
      return true;
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.orderStatusHelper = async (userId, orderDocId) => {
  try {
    const order = await orderSchema.aggregate([
      {
        $match: { userId: new ObjectId(userId), _id: new ObjectId(orderDocId) },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "addressId",
          foreignField: "_id",
          as: "address",
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $group: {
          _id: "$_id",
          orderStatus: {
            $push: {
              orderId: "$orderId",
              orderDate: "$orderedAt",
              orderTotal: "$grandTotal",
              orderStatus: "$orderStatus",
              shippingAddress: "$address",
              paymentMethod: "$paymentMethod",
            },
          },
          products: {
            $push: {
              productName: "$product.productName",
              productId: "$product._id",
              size: "$products.size",
              color: "$products.color",
              actualPrice : "$product.price",
              price: "$products.price",
              quantity: "$products.quantity",
              productImages: "$product.images",
            },
          },
        },
      },
    ]);

    return order[0];
  } catch (error) {
    console.log(error);
  }
};
