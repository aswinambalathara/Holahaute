const userSchema = require("../models/userModel");
const orderSchema = require("../models/orderModel");
const couponSchema = require("../models/couponModel");
const adminHelper = require("../helpers/adminHelper");
const categorySchema = require("../models/categoryModel");
const walletSchema = require("../models/walletmodel");
const { ObjectId } = require("mongodb");
const salesHelper = require("../helpers/salesHelper");
const { json } = require("express");
const productModel = require("../models/productModel");

module.exports.getAdminDashboard = async (req, res) => {
  try {
    const defaultSales = await salesHelper.monthlySalesHelp(
      new Date().getFullYear()
    );
    //const categorySales = await salesHelper.categorySalesHelp()
    const dashboardOrders = await salesHelper.dashboardOrdersHelp();
    const dashboardUsers = await adminHelper.dashboardUsersHelp();
    const totalProducts = await productModel.find({ isDeleted: false }).count();
    const totalCategories = await categorySchema.find({ status: true }).count();
    const topSelling = await adminHelper.topSellHelp()
    const topSellingProducts = topSelling.bestSellingProducts
    const topSellingCategories = topSelling.bestSellingCategories
    //console.log(topSellingProducts)
    const monthsArray = defaultSales.monthsArray;
    const salesArray = JSON.stringify(defaultSales.sales);
    res.render("admin/dashboard", {
      title: "DashBoard",
      monthsArray,
      salesArray,
      dashboardOrders,
      dashboardUsers,
      totalProducts,
      totalCategories,
      topSellingCategories,
      topSellingProducts
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.generateSales = async (req, res) => {
  try {
    const { type } = req.body;
    console.log(type);
    if (type === "daily") {
      const { fromDate, toDate } = req.body;
      const dailySales = await salesHelper.dailySalesHelp(
        new Date(fromDate),
        new Date(toDate)
      );
      if (dailySales.sales.every((value) => value === 0)) {
        return res.json({
          status: false,
          message: "No sales",
        });
      } else {
        return res.json({
          status: true,
          result: dailySales,
          description: `Daily sales from ${new Date(fromDate)
            .toISOString()
            .substring(0, 10)} to ${new Date(toDate)
            .toISOString()
            .substring(0, 10)}`,
        });
      }
    } else if (type === "weekly") {
      const { fromDate, toDate } = req.body;
      //console.log(req.body)
      const weeklySales = await salesHelper.weeklySalesHelp(
        new Date(fromDate),
        new Date(toDate)
      );
      if (weeklySales.sales.every((value) => value === 0)) {
        return res.json({
          status: false,
          message: "No sales",
        });
      } else {
        return res.json({
          status: true,
          result: weeklySales,
          description: `Weekly sales from ${new Date(fromDate)
            .toISOString()
            .substring(0, 10)} to ${new Date(toDate)
            .toISOString()
            .substring(0, 10)}`,
        });
      }
    } else if (type === "monthly") {
      const { year } = req.body;
      const monthlySales = await salesHelper.monthlySalesHelp(year);
      if (monthlySales.sales.every((sale) => sale === 0)) {
        return res.json({
          status: false,
          message: "No sales",
        });
      } else {
        return res.json({
          status: true,
          result: monthlySales,
          description: `Monthly sales of the Year ${year}`,
        });
      }
    } else if (type === "yearly") {
      const { fromYear, toYear } = req.body;
      const yearlySales = await salesHelper.yearlySalesHelp(fromYear, toYear);
      if (yearlySales.sales.every((sale) => sale === 0)) {
        return res.json({
          status: false,
          message: "No Sales Found",
        });
      } else {
        return res.json({
          status: true,
          result: yearlySales,
          description: `Yearly sales from ${fromYear} to ${toYear}`,
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports.generateSalesReport = async (req, res) => {
  try {
    const { format, salesData } = req.body;
    //console.log(req.body)
    if (format === "excel") {
      adminHelper.generateExcelDoc(salesData, res);
    } else {
      adminHelper.generatePdfDoc(salesData, res);
    }
  } catch (error) {
    console.log(error);
  }
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
      {
        $sort:{orderedAt:-1}
      }
    ])
    //console.log(orders);
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
    //console.log(order);
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
    console.log(changeStage);
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
                remarks: "Amount returned from cancel order",
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
            }else{
              return res.status(200).json({
                status: true,
                message: "stage changed",
              });
            }
          } else {
            const WalletAmount = order.walletApplied ? order.walletApplied : 0;
            const returnAmount = order.grandTotal + WalletAmount;
            const history = {
              paymentType: "Deposit",
              amount: returnAmount,
              currentBalance: wallet.balance + returnAmount,
              remarks: "Amount returned from cancel order",
            };
            const updateWallet = await walletSchema.updateOne(
              { userId: order.userId },
              {
                $inc: { balance: Number(returnAmount) },
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
        }
      } else if (changeStage === "RETURN ORDER") {
        const changed = await orderSchema.updateOne(
          { _id: id, userId: order.userId },
          {
            $set: {
              orderStage: "ORDER RETURNED",
              orderStatus: "ORDER RETURNED",
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
                remarks: "Amount returned from return order",
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
            }else{
              return res.status(200).json({
                status: true,
                message: "stage changed",
              });
            }
          } else {
            const WalletAmount = order.walletApplied ? order.walletApplied : 0;
            const returnAmount = order.grandTotal + WalletAmount;
            const history = {
              paymentType: "Deposit",
              amount: returnAmount,
              currentBalance: wallet.balance + returnAmount,
              remarks: "Amount returned from return order",
            };
            const updateWallet = await walletSchema.updateOne(
              { userId: order.userId },
              {
                $inc: { balance: Number(returnAmount) },
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

//-`module.exports.doAdminCancelOrder = async (req, res) => {};

module.exports.getAdminCoupons = async (req, res) => {
  try {
    const updates = await couponSchema.updateMany(
      { validTo: { $lt: Date.now() } },
      { $set: { isExpired: true } }
    );
    const categories = await categorySchema.find({ status: true });
    let coupons = await couponSchema.find({}).populate("validFor");
    res.render("admin/adminCoupons", { title: "Coupons", coupons, categories });
  } catch (error) {
    console.error(error);
  }
};

module.exports.doAddCoupon = async (req, res) => {
  try {
    //console.log(req.body);
    const {
      couponName,
      couponCode,
      validFrom,
      validTo,
      validFor,
      discount,
      minimumPurchaseAmount,
      maximumDiscount,
    } = req.body;
    const coupon = await couponSchema.findOne({ couponCode: couponCode });
    if (coupon) {
      if (coupon.validTo > Date.now()) {
        return res.status(409).json({
          status: false,
          message: "Coupon with same code already exist",
        });
      }
    }
    const newCoupon = new couponSchema({
      couponName,
      couponCode,
      validFrom: new Date(validFrom),
      validFor,
      validTo: new Date(validTo),
      discountPercentage: Number(discount),
      minimumPurchaseAmount: Number(minimumPurchaseAmount),
      maximumDiscount: Number(maximumDiscount),
    });
    const added = await newCoupon.save();
    if (added) {
      return res.status(200).json({
        status: true,
        message: "Coupon added successfully",
      });
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports.doFetchCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = await couponSchema.findOne({ _id: couponId });
    //console.log(coupon);
    if (coupon) {
      return res.json({
        status: true,
        coupon: coupon,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports.doEditCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const {
      couponName,
      couponCode,
      validFrom,
      validTo,
      validFor,
      discount,
      minimumPurchaseAmount,
      maximumDiscount,
    } = req.body;
    const couponCheck = await couponSchema.findOne({ couponCode: couponCode });
    //console.log(couponCheck,couponId);
    if (couponCheck && !couponCheck._id.equals(couponId)) {
      if (couponCheck.validTo > Date.now()) {
        return res.json({
          status: false,
          message: "Coupon Already Exist with same code or name",
        });
      }
    } else {
      const isExpired = new Date(validTo) > Date.now() ? false : true;
      //console.log(isExpired);
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
            minimumPurchaseAmount: minimumPurchaseAmount,
            maximumDiscount: maximumDiscount,
            isExpired: isExpired,
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
    console.error(error);
  }
};

module.exports.doDeleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    //console.log(couponId)
    if (couponId) {
      const deleted = await couponSchema.deleteOne({ _id: couponId });
      if (deleted) {
        return res.status(200).json({
          status: true,
          message: "Coupon Deleted",
        });
      } else {
        return res.json({
          status: false,
          message: "something went wrong",
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
};
