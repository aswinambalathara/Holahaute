const userSchema = require("../models/userModel");
const orderSchema = require("../models/orderModel");
const couponSchema = require("../models/couponModel");
const adminHelper = require("../helpers/adminHelper");
const categorySchema = require("../models/categoryModel");
const walletSchema = require("../models/walletmodel");
const { ObjectId } = require("mongodb");
const salesHelper = require('../helpers/salesHelper');

module.exports.getAdminDashboard = async (req, res) => {
  try {
    res.render("admin/dashboard", { title: "DashBoard",});
  } catch (error) {
    console.log(error)
  }
};

module.exports.generateSales = async (req,res) =>{
  const {startDate,EndDate,type} = req.body;
  if(type === 'default'){
    const defaultSales = await salesHelper.monthlySalesHelp();
    res.json({
      status : true,
      sales : defaultSales
    })
  }
  
}

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
    const order = await adminHelper.orderInfoHelper(orderId);
    console.log(order);
    if (order) {
      res.render("admin/adminOrderManagement.ejs", {
        title: "OrderInfo",
        order,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doChangeOrderStage = async (req, res) => {
  try {
    const id = req.params.id;
    const { changeStage } = req.body;
    const order = await orderSchema.findOne({ _id: id });
    //console.log(changeStage);
    console.log(order);
    if (changeStage !== order.orderStage) {
      if (changeStage === "CANCEL ORDER") {
        const changed = await orderSchema.updateOne(
          { _id: id, userId: order.userId },
          {
            $set: {
              orderStage: "ORDER CANCELLED",
              orderStatus: "ORDER CANCELLED",
              updatedAt: Date.now(),
            },
          }
        );
        if (changed) {
          const paymentMethod = order.paymentMethod.method;
          const wallet = await walletSchema.findOne({
            userId: order.userId,
          });
          if (paymentMethod === "COD") {
            if (order.walletApplied) {
              const returnWalletAmt = order.walletApplied;
              const history = {
                paymentType: "Deposit",
                amount: returnWalletAmt,
                currentBalance: wallet.balance + returnWalletAmt,
                remarks: "Amout returned from cancel order",
              };
              const updateWallet = await walletSchema.updateOne(
                { userId: order.userId },
                {
                  $inc: { balance: Number(returnWalletAmt) },
                  $push: { history: history },
                }
              );
              if (updateWallet) {
                return res.status(200).json({
                  status: true,
                  message: "stage changed",
                });
              }
            }
          } else {
            const WalletAmount = order.walletApplied ? order.walletApplied : 0;
            const returnAmount = order.grandTotal + WalletAmount;
            const history = {
              paymentType: "Deposit",
              amount: returnAmount,
              currentBalance: wallet.balance + returnAmount,
              remarks: "Amout returned from cancel order",
            };
            const updateWallet = await walletSchema.updateOne(
              { userId: order.userId },
              {
                $inc: { balance: Number(returnAmount) },
                $push: { history: history },
              }
            );
            if(updateWallet){
            return res.status(200).json({
                status: true,
                message: "stage changed",
              });
            }
          }
        }
      } else {
        const changed = await orderSchema.updateOne(
          { _id: id, userId: order.userId },
          {
            $set: {
              orderStage: changeStage.toUpperCase(),
              orderStatus: changeStage.toUpperCase(),
              updatedAt: Date.now(),
            },
          }
        );
        if (changed) {
          res.status(200).json({
            status: true,
            message: "stage changed",
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doAdminCancelOrder = async (req, res) => {};

module.exports.getAdminCoupons = async (req, res) => {
  try {
    const categories = await categorySchema.find({ status: true });
    const coupons = await couponSchema.find({}).populate("validFor");
    res.render("admin/adminCoupons", { title: "Coupons", coupons, categories });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doAddCoupon = async (req, res) => {
  try {
    //console.log(req.body);
    const { couponName, couponCode, validFrom, validTo, validFor, discount } =
      req.body;
    const coupon = await couponSchema.findOne({
      $or: [{ couponCode: couponCode }, { couponName: couponName }],
    });
    if (coupon) {
      if (coupon.validTo > Date.now()) {
        return res.status(409).json({
          status: false,
          message: "Coupon with same code or name already exist",
        });
      }
      //else{
      //   return res.json({
      //     status : false,
      //     expiredCoupon : true,
      //     couponId : coupon._id,
      //     message : "There is a expired coupon with same name or code do you wish to edit it ?"
      //   });
      // }
    }
    const newCoupon = new couponSchema({
      couponName,
      couponCode,
      validFrom: new Date(validFrom),
      validFor,
      validTo: new Date(validTo),
      discountPercentage: Number(discount),
    });
    const added = await newCoupon.save();
    if (added) {
      return res.status(200).json({
        status: true,
        message: "Coupon added successfully",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doFetchCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = await couponSchema.findOne({ _id: couponId });
    console.log(coupon);
    if (coupon) {
      return res.json({
        status: true,
        coupon: coupon,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doEditCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const { couponName, couponCode, validFrom, validTo, validFor, discount } =
      req.body;
    const couponCheck = await couponSchema.findOne({
      $or: [{ couponName: couponName }, { couponCode: couponCode }],
    });
    //console.log(couponCheck,couponId);
    if (couponCheck && !couponCheck._id.equals(couponId)) {
      if (couponCheck.validTo > Date.now()) {
        return res.json({
          status: false,
          message: "Coupon Already Exist with same code or name",
        });
      }
    } else {
      const updated = await couponSchema.updateOne(
        { _id: couponId },
        {
          $set: {
            couponName: couponName,
            couponCode: couponCode,
            validFrom: validFrom,
            validTo: validTo,
            validFor: validFor,
            discountPercentage: discount,
          },
        }
      );
      if (updated) {
        res.json({
          status: true,
          message: "Coupon updates Successfull",
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};
