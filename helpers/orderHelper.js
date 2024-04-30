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
          orderId: { $first: "$orderId" },
          orderDate: { $first: "$orderedAt" },
          paymentStatus: {
            $first: {
              $cond: {
                if: { $eq: ["$paymentMethod.method", "razorpay"] },
                then: "Already Paid",
                else: "Received on delivery",
              },
            },
          },
          subTotal: { $sum: "$total" },
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
          orderId: 1,
          subTotal: 1,
          paymentStatus : 1,
          orderDate : 1,
          shipping: {
            name: { $arrayElemAt: ["$user.name", 0] },
            addressLine: { $arrayElemAt: ["$user.address.addressLine", 0] },
            district: { $arrayElemAt: ["$user.address.district", 0] },
            state: { $arrayElemAt: ["$user.address.state", 0] },
            pincode: { $arrayElemAt: ["$user.address.pincode", 0] },
            mobile: { $arrayElemAt: ["$user.address.mobile", 0] },
          },
          products: 1,
        },
      },
    ]);
    console.log(order[0]);
    return order[0];
  } catch (error) {
    console.error(error);
  }
};

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

module.exports.generateInvoicePDF = (order, res) => {
  try {
    let doc = new PDFDocument();

    generateHeader(doc);
    generateCustomerInformation(doc, order);
    generateInvoiceTable(doc, order);
    generateFooter(doc);
    doc.end();
    doc.pipe(res);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice.pdf`);
  } catch (error) {
    console.error(error);
  }
};


//generate invoice utils start
function generateHeader(doc) {
  doc
    .image("public/images/logo/logo_1.png", 50, 45, { width: 50 })
    .fillColor("#444444")
    .fontSize(18)
    .text("HolaHaute", 110, 60)
    .fontSize(10)
    .text("HolaHaute", 200, 50, { align: "right" })
    .text("123 Main Street", 200, 65, { align: "right" })
    .text("Kerala, India, 695615", 200, 80, { align: "right" })
    .moveDown();
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text("Thank you for your business with us.", 50, 780, {
      align: "center",
      width: 500,
    });
}

function generateCustomerInformation(doc, invoice) {
  const shipping = invoice.shipping;

  doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text("1234", 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(formatDate(new Date(invoice.orderDate)), 150, customerInformationTop + 15)
    .text("Payment Status:", 50, customerInformationTop + 30)
    .text(invoice.paymentStatus, 150, customerInformationTop + 30)

    .font("Helvetica-Bold")
    .text(shipping.name, 380, customerInformationTop)
    .font("Helvetica")
    .text(shipping.addressLine, 380, customerInformationTop + 15)
    .text(
      shipping.district + ", " + shipping.state + ", " + shipping.pincode,
      380,
      customerInformationTop + 30
    )
    .text(shipping.mobile, 380, customerInformationTop + 45)
    .moveDown();

  generateHr(doc, 270);
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return day + "/" + month + "/" + year;
}

function generateInvoiceTable(doc, invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Description",
    "Unit Cost",
    "Quantity",
    "Total"
  );

  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < invoice.products.length; i++) {
    const item = invoice.products[i];

    item.productName = `${item.productName}(${item.size},${item.color})`;
    let nameSplitArray =
      item.productName.length > 47
        ? splitString(item.productName, 47)
        : [item.productName];
    console.log(item.productName.length);
    let productName = "";
    for (let j = 0; j < nameSplitArray.length; j++) {
      productName += `${nameSplitArray[j]}\n`;
    }

    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      productName,
      formatCurrency(item.total / item.quantity),
      item.quantity,
      formatCurrency(item.total)
    );

    generateHr(doc, position + 30);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 40;
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "Subtotal",
    "",
    formatCurrency(invoice.subTotal)
  );

  const couponPosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    couponPosition,
    "",
    "Coupon Discount",
    "",
    formatCurrency(invoice.couponDiscount)
  );

  const walletPostion = couponPosition + 20;

  generateTableRow(
    doc,
    walletPostion,
    "",
    "Wallet Applied",
    "",
    formatCurrency(invoice.walletApplied)
  );
  //doc.font("Helvetica");

  const grandTotalPosition = walletPostion + 25;
  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    grandTotalPosition,
    "",
    "GRAND TOTAL ",
    "",
    formatCurrency(invoice.grandTotal)
  );
}

function generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    //.text(description, 200, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function formatCurrency(amount) {
  return amount.toFixed(2);
}

function splitString(str, chunkLength) {
  return str.match(new RegExp(".{1," + chunkLength + "}", "g"));
}

//generate invoice utils end