const cartSchema = require("../models/cartModel");
const productSchema = require("../models/productModel");
const addressSchema = require("../models/addressModel");
const orderHelper = require("../helpers/orderHelper");
const paymentHelper = require("../helpers/paymentHelper");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { ObjectId } = require("mongodb");
const { RAZORPAY_KEY_SECRET } = process.env;
const crypto = require("crypto");
const walletSchema = require("../models/walletmodel");
const orderSchema = require("../models/orderModel");

module.exports.doCartPlaceOrder = async (req, res) => {
  try {
    const {
      addressId,
      paymentOption,
      walletAmount,
      couponDiscount,
      couponCode,
    } = req.body;
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const userId = authUser.userId;
    const orderId = uuidv4();
    const order = await orderHelper.makeOrderHelper(userId);
    //console.log(order);
    const product = order.orderInfo.map((item) => {
      return item.product;
    });

    const stock = await orderHelper.checkProductQuantity(
      order.totalQuantityByProduct
    );

    if (stock === true) {
      const decreaseQuantity = await orderHelper.decreaseProductQuantity(
        order.totalQuantityByProduct
      );
      if (walletAmount !== 0) {
        const wallet = await walletSchema.findOne({ userId: userId });
        const history = {
          paymentType: "Withdrawal",
          amount: walletAmount,
          currentBalance: wallet.balance - walletAmount,
        };
        const updateWallet = await walletSchema.updateOne(
          { userId: userId },
          {
            $inc: { balance: -Number(walletAmount) },
            $push: { history: history },
          }
        );
      }

      if (decreaseQuantity) {
        let couponApplied ;
        if(couponDiscount !== 0){
          couponApplied = {
            couponCode : couponCode,
            couponDiscount : couponDiscount
          }
        }
        const walletApplied = walletAmount !== 0 ? walletAmount : undefined
        const orderStatus = paymentOption === "COD" ? "CONFIRMED" : "PENDING";
        const grandTotal = order.subTotal - (walletAmount + couponDiscount);
        const newOrder = new orderSchema({
          userId: userId,
          addressId: addressId,
          orderId: orderId,
          orderStatus: orderStatus,
          products: product,
          subTotal : order.subTotal,
          grandTotal: grandTotal,
          "paymentMethod.method": paymentOption,
          couponApplied: couponApplied,
          walletApplied : walletApplied
        });
        const ordered = await newOrder.save();
        if (ordered) {
          req.session.currentOrderId = ordered._id;
          //CLEAR CART
          await cartSchema.updateOne(
            { userId: userId },
            { $set: { cartItems: [] } }
          );

          if (paymentOption === "COD" || grandTotal === 0) { 
            res.json({
              status: true,
              message: "OrderSuccessfull",
            });
          } else if (paymentOption === "razorpay" && grandTotal !== 0) {
            const payment = await paymentHelper.createPayment(
              orderId,
              grandTotal
            );
            res.json({
              status: false,
              payment: payment,
            });
          }
        }
      }
    } else {
      res.json({
        status: false,
        product: `${stock.toUpperCase()},`,
        message: "is not available at this quantity",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doverifyPayment = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const { userId } = authUser;
    const { response, order } = req.body;
    console.log(req.body);
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      response;
    let sign = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET);
    sign.update(razorpay_order_id + "|" + razorpay_payment_id);
    sign = sign.digest("hex");
    if (sign === razorpay_signature) {
      const orderUpdate = await orderSchema.updateOne(
        { orderId: order.notes.order_Id },
        {
          $set: {
            orderStatus: "CONFIRMED",
            "paymentMethod.paymentId": razorpay_payment_id,
          },
        }
      );

      if (orderUpdate) {
        res.json({
          paid: true,
        });
      }
    } else {
      res.json({
        paid: false,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getOrderStatusPage = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const orderDocId =
      req.session.currentOrderId || new ObjectId("65f59267420377fcef3ba215");
    const order = await orderHelper.orderStatusHelper(
      authUser.userId,
      orderDocId
    );
    //console.log('orderstatus');
    //console.log(order);
    req.session.currentOrderId = "";
    res.render("user/orderconfirm.ejs", {
      title: "Order Status",
      user: authUser.userName,
      order: order,
      orderDate: order.orderStatus[0].orderDate.toLocaleDateString(),
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getMyorders = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const orders = await orderSchema
      .find({ userId: new ObjectId(authUser.userId) })
      .sort({ orderedAt: -1 })
      .populate("products.productId")
      .exec();
    //console.log(orders);
    const arrivals = orders.map((order) => {
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return order.estimatedArrival.toLocaleDateString(undefined, options);
    });
    //console.log(arrivals);
    res.render("user/myorders.ejs", {
      title: "My Orders",
      user: authUser.userName,
      orders,
      //arrivals
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const order = await orderHelper.orderStatusHelper(authUser.userId, orderId);
    //console.log(order);
    res.render("user/orderDetail.ejs", {
      title: "Order",
      user: authUser.userName,
      order: order,
      orderDate: order.orderStatus[0].orderDate.toLocaleDateString(),
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getOrderTracking = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const orderId = req.params.id;
    const orderTrack = await orderSchema
      .findOne({
        userId: new ObjectId(authUser.userId),
        _id: new ObjectId(orderId),
      })
      .populate("products.productId");
    //console.log(orderTrack)
    res.render("user/trackOrder.ejs", {
      title: "Tracking Order",
      user: authUser.userName,
      orderTrack,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doCancelOrder = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const id = req.params.id;
    const { cancelReason } = req.body;
    //console.log(id,"  ",cancelReason);
    const order = await orderSchema.findOne({
      _id: id,
      userId: authUser.userId,
    });
    if (
      order.orderStage === "PREPARING FOR DISPATCH" ||
      order.orderStage === "SHIPPED"
    ) {
      const updateorder = await orderSchema.updateOne(
        { _id: id, userId: authUser.userId },
        {
          $set: {
            cancelReason: cancelReason,
            orderStatus: "CANCELLATION REQUESTED",
            orderStage: "CANCELLATION REQUESTED",
          },
        }
      );
      if (updateorder) {
        res.json({
          status: true,
          stage: "Cancellation Requested",
          message: "Your request is on review",
        });
      } else {
        res.json({
          status: false,
          message: "Something went Wrong",
        });
      }
    } else {
      res.json({
        status: false,
        message: "Cannot Cancel at this stage",
      });
    }
    const updateorder = await orderSchema.updateOne(
      { _id: id, userId: authUser.userId },
      {
        $set: {
          cancelReason: cancelReason,
          orderStatus: "CANCELLATION REQUESTED",
        },
      }
    );
  } catch (error) {
    console.log(error);
  }
};
