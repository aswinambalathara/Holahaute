const cartSchema = require("../models/cartModel");
const productSchema = require("../models/productModel");
const addressSchema = require("../models/addressModel");
const orderHelper = require('../helpers/orderHelper');
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { ObjectId } = require("mongodb");
const orderSchema = require("../models/orderModel");

module.exports.doCartPlaceOrder = async (req, res) => {
try {
    const { addressId, paymentOption } = req.body;
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const userId = authUser.userId;
    const orderId = uuidv4();
    // console.log(orderId)
    const order = await orderHelper.makeOrderHelper(userId)
    console.log('break')
     console.log(order);
    //  const product = order.orderInfo.map((item)=>{
    //     return item.product
    //  })
    //  console.log(product)

//     const newOrder = new orderSchema ({
//       userId : userId,
//       address : addressId,
//       orderId : orderId,
//       orderStatus : "active",
//       products : product,
//       grandTotal : Number(order.grandTotal),
//       paymentMethod : paymentOption,
//     })
//    const orderStatus = await newOrder.save()
//    if(orderStatus){
//     res.json({
//         status : true,
//         message : "orderSuccessfull"
//     })
//    }else{
//     res.json({
//         status : false,
//         message : "Somethng Went Wrong"
//     }) 
//    }
} catch (error) {
    console.log(error)
}
};

module.exports.getOrderStatusPage = async (req,res)=>{

};

module.exports.getMyorders = async (req,res)=>{

}

module.exports.doCancelOrder = async (req,res)=>{

}
