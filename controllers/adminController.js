const userSchema = require("../models/userModel");
const orderSchema = require("../models/orderModel");
const couponSchema = require('../models/couponModel');
const adminHelper = require('../helpers/adminHelper');
const { ObjectId } = require("mongodb");
module.exports.getAdminDashboard = (req, res) => {
  res.render("admin/dashboard", { title: "DashBoard" });
};

module.exports.getAdminUsers = async (req, res) => {
  try {
    const users = await userSchema.find({});
    if (users) {
      res.render("admin/adminUsers", {
        title: "Users",
        users,
        alert: req.flash("userstatus"),
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doUserBlock = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await userSchema.findOne({ _id: id });
    if (user) {
      await userSchema.updateOne(
        { _id: id },
        {
          $set: {
            isBlocked: true,
          },
        }
      );
      req.session.userIsBlocked = true;
      res.json({
        status: "blocked",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doUserUnBlock = async (req, res) => {
  try {
    const user = await userSchema.findOne({ _id: req.params.id });
    if (user) {
      await userSchema.updateOne(
        { _id: req.params.id },
        {
          $set: {
            isBlocked: false,
          },
        }
      );
      req.session.userIsBlocked = false;
      res.json({
        status: "unBlocked",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// module.exports.toggleUserBlock = async (req,res)=>{
//   try {
//     const user = await userSchema.findOne({_id:req.params.id});
//     user.isBlocked = !user.isBlocked
//     await user.save()
//     res.json({
//       status : user.isBlocked? "blocked" : "unblocked"
//     })
//   } catch (error) {
//     console.log(error);
//   }
// }

module.exports.getAdminOrders = async (req, res) => {
  try {
    const orders = await orderSchema.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
    ]);
    console.log(orders);
    if (orders) {
      res.render("admin/adminOrders", { title: "Orders", orders });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getAdminOrderInfo = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await adminHelper.orderInfoHelper(orderId)
    console.log(order)
    if(order){
      res.render("admin/adminOrderManagement.ejs", { title: "OrderInfo",order});
    }
    
  } catch (error) {
    console.log(error);
  }
};

module.exports.doChangeOrderStage = async (req, res) => {
  try {
    const id = req.params.id
    const {changeStage} = req.body;
    const order = await orderSchema.findOne({_id: id})
    console.log(changeStage)
    console.log(order);
    if(changeStage !== order.orderStage){
      
      if(changeStage === 'CANCEL ORDER'){
        const changed = await orderSchema.updateOne({_id:id,userId:order.userId},{$set:{
          orderStage : 'ORDER CANCELLED',
          orderStatus : 'ORDER CANCELLED',
          updatedAt : Date.now(),
        }});
        if(changed){
          res.status(200).json({
            status : true,
            message : "stage changed"
          })
        }
      }else{
        const changed = await orderSchema.updateOne({_id:id,userId:order.userId},{$set:{
          orderStage : changeStage.toUpperCase(),
          orderStatus : changeStage.toUpperCase(),
          updatedAt : Date.now()
        }});
        if(changed){
          res.status(200).json({
            status : true,
            message : "stage changed"
          })
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
};

module.exports.doAdminCancelOrder = async (req, res) => {};

module.exports.getAdminCoupons = async (req,res) =>{
try {
  res.render("admin/adminCoupons", { title: "Coupons" });
} catch (error) {
  console.log(error);
}
};

module.exports.doAddCoupon = async (req,res) =>{
  try {
    
  } catch (error) {
    console.log(error)
  }
}