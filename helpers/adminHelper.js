const couponSchema = require("../models/couponModel");
const orderSchema = require("../models/orderModel");
const userSchema = require("../models/userModel");
const { ObjectId } = require("mongodb");

module.exports.orderInfoHelper = async (orderDocId) => {
  try {
    const order = await orderSchema.aggregate([
      {
        $match: { _id: new ObjectId(orderDocId) },
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
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $group: {
          _id: "$_id",
          user: {
            $push: {
              userId: "$user._id",
              userName: "$user.fullName",
              email: "$user.email",
              mobile: "$user.phone",
            },
          },
          orderStatus: {
            $push: {
              orderId: "$orderId",
              orderDate: "$orderedAt",
              updateDate: "$updatedAt",
              orderTotal: "$grandTotal",
              orderStatus: "$orderStatus",
              orderStage: "$orderStage",
              shippingAddress: "$address",
              paymentMethod: "$paymentMethod",
              cancelReason: "$cancelReason",
            },
          },
          products: {
            $push: {
              productName: "$product.productName",
              productId: "$product._id",
              size: "$products.size",
              color: "$products.color",
              price: "$product.price",
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

module.exports.dashboardUsersHelp = async () => {
  const dashboardUsers = await userSchema.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: { if: { $eq: ["$isBlocked", false] }, then: 1, else: 0 },
          },
        },
        blockedUsers: {
          $sum: {
            $cond: { if: { $eq: ["$isBlocked", true] }, then: 1, else: 0 },
          },
        },
      },
    },
  ]);
return dashboardUsers
  //console.log(dashboardUsers)
};
