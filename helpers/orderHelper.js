const cartSchema = require("../models/cartModel");
const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");
const productSchema = require("../models/productModel");
const orderSchema = require("../models/orderModel");
const PDFDocument = require("pdfkit");
const doc = require("pdfkit");
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
          totalQuantityByProduct: 1,
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
          totalQuantityByProduct: 1,
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
              actualPrice: "$product.price",
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

module.exports.orderInvoiceHelp = async (orderDocId) => {
  try {
    const order = await orderSchema.aggregate([
      {
        $match: {
          _id: new ObjectId(orderDocId),
        },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "addressId",
          foreignField: "_id",
          as: "address",
        },
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $addFields: {
          total: { $multiply: ["$products.price", "$products.quantity"] },
        },
      },
      {
        $group: {
          _id: "$_id",
          products: {
            $push: {
              productName: "$product.productName",
              size: "$products.size",
              color: "$products.color",
              quantity: "$products.quantity",
              price: "$products.price",
              total: "$total",
            },
          },
          user: {
            $first: {
              name: "$address.fullName",
              address: {
                addressLine: "$address.address",
                district: "$address.district",
                state: "$address.state",
                pincode: "$address.pincode",
                mobile: "$address.mobile",
              },
            },
          },
          grandTotal: { $first: "$grandTotal" },
          walletApplied: { $first: { $ifNull: ["$walletApplied", 0] } },
          couponDiscount: {
            $first: {
              $cond: {
                if: { $ifNull: ["$couponApplied", false] },
                then: "$couponApplied.couponDiscount",
                else: 0,
              },
            },
          },
        },
      },
      {
        $project: {
          grandTotal: 1,
          walletApplied: 1,
          couponDiscount: 1,
          user: {
            name: { $arrayElemAt: ["$user.name", 0] },
            address: {
              addressLine: { $arrayElemAt: ["$user.address.addressLine", 0] },
              district: { $arrayElemAt: ["$user.address.district", 0] },
              state: { $arrayElemAt: ["$user.address.state", 0] },
              pincode: { $arrayElemAt: ["$user.address.pincode", 0] },
              mobile: { $arrayElemAt: ["$user.address.mobile", 0] },
            },
          },
          products: 1,
        },
      },
    ]);
    const productsData = order[0].products.map((product) => {
      return [
        product.productName,
        product.size + "," + product.color,
        product.quantity,
        product.price,
        product.total,
      ];
    });
    const subTotal = order[0].products.reduce((acc, product) => {
      acc += product.price;
      return acc;
    }, 0);
    //console.log(subTotal);
    //console.log(productsData);
    //console.log(order[0]);
    return {
      tableData: productsData,
      user: order[0].user,
      grandTotal: order[0].grandTotal,
      walletApplied: order[0].walletApplied,
      couponDiscount: order[0].couponDiscount,
      subTotal: subTotal,
    };
  } catch (error) {
    console.error(error);
  }
};

module.exports.generateInvoicePDF = (order, res) => {
  try {
    let doc = new PDFDocument();

    generateHeader(doc);
    generateFooter(doc);
    doc.end();
    doc.pipe(res);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice.pdf`);
  } catch (error) {
    console.error(error);
  }
};

function generateHeader(doc) {
  doc
    .image("public/images/logo/logo_1.png", 50, 45, { width: 50 })
    .fillColor("#444444")
    .fontSize(18)
    .text("HolaHaute", 110, 60)
    .fontSize(10)
    .text("123 Main Street", 200, 65, { align: "right" })
    .text("Kerala, India, 695615", 200, 80, { align: "right" })
    .moveDown();
}

function generateFooter(doc) {
	doc.fontSize(
		10,
	).text(
		'Thank you for your business with us.',
		50,
		780,
		{ align: 'center', width: 500 },
	);
}


module.exports.updateOrderStatus = async (userId) => {
  try {
    const oneHourInMs = 60 * 60 * 1000; // One hour in milliseconds
    const pendingOrders = await orderSchema.find({
      userId: userId,
      orderStatus: "PENDING",
      orderedAt: { $lt: new Date(Date.now() - oneHourInMs) },
    });

    console.log(pendingOrders);
    if (pendingOrders) {
      const updateCount = await orderSchema.updateMany(
        { _id: { $in: pendingOrders.map((order) => order._id) } },
        {
          $set: {
            orderStatus: "ORDER CANCELLED",
            orderStage: "ORDER CANCELLED",
          },
        }
      );
      //console.log(updateCount)
    }
  } catch (error) {
    console.error(error);
  }
};
