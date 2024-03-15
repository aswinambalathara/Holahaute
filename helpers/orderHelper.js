const cartSchema = require("../models/cartModel");
const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");
const { pipeline } = require("nodemailer/lib/xoauth2");

module.exports.makeOrderHelper = async (userId)=>{
    const order = await cartSchema.aggregate([
        { $match: { userId: new ObjectId(userId) } },
        { $unwind: "$cartItems" },
        {$group:{_id:"$cartItems.productId",TotalQuatitybyProduct : {$sum:"$cartItems.quantity"},cartItems:{$push:"$cartItems"},userId:{$first:"$userId"}}},
        {$addFields:{
            TotalQuatitybyProduct : {
                productId : "$_id",
                quantity : "$TotalQuatitybyProduct"
            }
        }},
        {$unwind:"$cartItems"},
        {$lookup:{
            from : "products",
            localField: "cartItems.productId",
            foreignField :"_id",
            as:"product"
        }},
        {$unwind:"$product"},
        {$addFields:{
            orderTotal : {$multiply : ["$cartItems.quantity","$product.price"]}
        }},
        {$group:{_id:"$userId",grandTotal:{$sum:"$orderTotal"},orderInfo:{$push:{
            product : {
                productId: "$cartItems.productId",
                size : "$cartItems.size",
                quantity : "$cartItems.quantity",
                orderTotal : "$orderTotal"
            }}
        },TotalQuatitybyProduct:{$addToSet:"$TotalQuatitybyProduct"}}}
      ]);

      return order[0];
}