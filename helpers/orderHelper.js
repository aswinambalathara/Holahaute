const cartSchema = require("../models/cartModel");
const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");
const productSchema = require("../models/productModel");
const orderSchema = require("../models/orderModel");
const pdfKit = require("pdfkit");
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
        $group: {
          _id: "$_id",
          products: {
            $push: {
              productName: "$product.productName",
              size: "$products.size",
              color: "$products.color",
              quantity: "$products.quantity",
              price: "$products.price",
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
      ];
    });
    const subTotal = order[0].products.reduce((acc,product)=>{
      acc += product.price
      return acc
    },0);
    console.log(subTotal)
    //console.log(productsData);
    //console.log(order[0]);
    return {
      tableData: productsData,
      user: order[0].user,
      grandTotal: order[0].grandTotal,
      walletApplied: order[0].walletApplied,
      couponDiscount: order[0].couponDiscount,
      subTotal : subTotal
    };
  } catch (error) {
    console.error(error);
  }
};

module.exports.generateInvoicePDF = (order, res) => {
  try {
    const doc = new pdfKit();
    doc.pipe(res);
    const invoiceData = {
      user: order.user,

      company: {
        companyName: "HolaHaute",
        address: "eralla,Thampanoor",
        district: "trivandrum",
        state: "Kerala",
        pincode: "695615",
      },

      items: {
        tableHeaders: ["Description", "size & color", "quantity", "Price"],
        tableData: order.tableData
      },
      subTotal : order.subTotal,
      grandTotal: order.grandTotal,
      walletApplied : order.walletApplied,
      couponDiscount : order.couponDiscount
    };
    createInvoice(doc, invoiceData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice.pdf`);
  } catch (error) {
    console.error(error);
  }
};

function createInvoice(doc, invoiceData) {
  doc.image("public/images/logo/logo_1.png", 20, 15, { width: 50 });
  doc.moveTo(300, 0);
  doc.moveUp();
  doc.font("Helvetica-Bold").fontSize(15).text("HolaHaute", 75, 35);
  doc.moveUp();
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("Invoice", 0, 35, { align: "right" });
  doc.moveDown();

  doc
    .font("Helvetica")
    .fontSize(11)
    .text(`${invoiceData.user.name}`, 50, 110, { align: "left" });
  doc.text(`${invoiceData.user.address.addressLine}`, 50, 130, { align: "left" });
  doc.text(`${invoiceData.user.address.district}`, 50, 150, { align: "left" });
  doc.text(`${invoiceData.user.address.state}`, 50, 170, { align: "left" });
  doc.text(`${invoiceData.user.address.pincode}`, 50, 190, { align: "left" });
  doc.text(`${invoiceData.user.address.mobile}`, 50, 210, { align: "left" });

  doc.text(`${invoiceData.company.companyName}`, 400, 110, { align: "right" });
  doc.text(`${invoiceData.company.address}`, 400, 130, { align: "right" });
  doc.text(`${invoiceData.company.district}`, 400, 150, { align: "right" });
  doc.text(`${invoiceData.company.state}`, 400, 170, { align: "right" });
  doc.text(`${invoiceData.company.pincode}`, 400, 190, { align: "right" });

  doc.moveDown();

  let yPos = 250;

   yPos = createTable(
    doc,
    invoiceData.items.tableHeaders,
    invoiceData.items.tableData,
    yPos
  );
  doc.moveDown();
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`Sub Total : ${invoiceData.subTotal}`, 400, (yPos += 40));
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`Coupon Discount : ${invoiceData.couponDiscount}`, 400, (yPos += 30));
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`Wallet Applied : ${invoiceData.walletApplied}`, 400, (yPos += 20));
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`Grand Total : ${invoiceData.grandTotal}`, 400, (yPos += 30));

  doc.end();
}

function createTable(doc, tableHeaders, tableData,yPos) {

  // Draw table headers
  doc.font("Helvetica-Bold").fontSize(12);
  tableHeaders.forEach((header, i) => {
    doc.text(header, 50 + i * 150, yPos);
  });

  // Draw table data
  doc.font("Helvetica").fontSize(10);
  yPos += 30; // Move down for data rows
  tableData.forEach((row) => {
    row.forEach((cell, i) => {
      doc.text(String(cell), 50 + i * 150, yPos);
    });
    yPos += 30; // Move down for next row
  });

  return yPos;
}
