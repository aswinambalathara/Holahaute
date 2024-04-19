const cartSchema = require("../models/cartModel");
const productSchema = require("../models/productModel");
const couponSchema = require("../models/couponModel");
const orderSchema = require("../models/orderModel");
const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");

// module.exports.getCartHelper = async (userId) => {
//   try {
//     const cart = await cartSchema.aggregate([
//       { $match: { userId: new ObjectId(userId) } },
//       { $unwind: "$cartItems" },
//       {
//         $lookup: {
//           from: "products",
//           localField: "cartItems.productId",
//           foreignField: "_id",
//           as: "product",
//         },
//       },
//       {
//         $unwind: "$product",
//       },
//       {
//         $addFields: {
//           total: { $multiply: ["$cartItems.quantity", "$product.price"] },
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           grandTotal: { $sum: "$total" },
//           userId: { $first: "$userId" },
//           cartItems: {
//             $push: {
//               _id: "$cartItems._id",
//               productId: "$cartItems.productId",
//               quantity: "$cartItems.quantity",
//               totalPrice: "$total",
//               color: "$cartItems.color",
//               size: "$cartItems.size",
//               Products: {
//                 _id: "$product._id",
//                 productName: "$product.productName",
//                 price: "$product.price",
//                 quantity: "$product.quantity",
//                 images: "$product.images",
//               },
//             },
//           },
//         },
//       },
//     ]);
//     //console.log(cart)
//     return cart;
//   } catch (error) {
//     console.error(error)
//   }
// };

module.exports.getCartHelper = async (userId)=>{
try {
  const today = new Date()
  const cart = await cartSchema.aggregate([
    { $match: { userId: new ObjectId(userId) } },
    { $unwind: "$cartItems" },
    {
      $lookup: {
        from: "products",
        localField: "cartItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $project : {
        cartItems:1,
        userId : "$userId",
        product:{$mergeObjects : ["$$ROOT.product","$product.offer"]}
      }
    },
    {
      $lookup :{
        from : "offers",
        localField : "product.offerId",
        foreignField : "_id",
        as: "availableOffer"
      }
    },
    {
      $addFields :{
        offerExist: { $ne: ["$availableOffer", []] },
      }
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
      $project:{
        cartItems : 1,
        userId : "$userId",
        product : 1,
        offerStatus : 1,
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
      }
    },
    {
      $addFields: {
        total: { $multiply: ["$cartItems.quantity", "$offer.currentPrice"] },
      },
    },
    {
      $group:{
        _id:"$_id",
        grandTotal : {$sum:"$total"},
        userId : {$first : "$userId"},
        cartItems: {
          $push: {
            _id: "$cartItems._id",
            productId: "$cartItems.productId",
            quantity: "$cartItems.quantity",
            totalPrice: "$total",
            color: "$cartItems.color",
            size: "$cartItems.size",
            Products: {
              _id: "$product._id",
              productName: "$product.productName",
              currentPrice : "$offer.currentPrice",
              price: "$product.price",
              quantity: "$product.quantity",
              images: "$product.images",
              discount : "$offer.discount"
            },
          },
        },
      }
    }
  ]);
  console.log(cart)
  return cart[0]
} catch (error) {
  console.error(error)
}
}

module.exports.updateQuantityHelper = async (userId, itemId) => {
  const cart = await cartSchema.aggregate([
    { $match: { userId: new ObjectId(userId) } },
    { $unwind: "$cartItems" },
    { $match: { "cartItems._id": new ObjectId(itemId) } },
    {
      $lookup: {
        from: "products",
        localField: "cartItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
  ]);
  return cart;
};

module.exports.getCheckoutHelper = async (userId) => {
  const cart = await cartSchema.aggregate([
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
      $addFields: {
        orderTotal: { $multiply: ["$cartItems.quantity", "$product.price"] },
      },
    },
    {
      $group: {
        _id: "$userId",
        grandTotal: { $sum: "$orderTotal" },
        orderInfo: {
          $push: {
            product: {
              productName: "$product.productName",
              price: "$product.price",
              category: "$product.category",
              productId: "$cartItems.productId",
              size: "$cartItems.size",
              quantity: "$cartItems.quantity",
              orderTotal: "$orderTotal",
              color: "$cartItems.color",
            },
          },
        },
        totalQuantityByProduct: { $addToSet: "$totalQuantityByProduct" },
      },
    },
  ]);
  return cart[0];
};

module.exports.availableCouponHelper = async (products) => {
  const updateCoupons = await couponSchema.updateMany(
    { validTo: { $lt: Date.now() } },
    { $set: { isExpired: true } }
  );
  if (updateCoupons.acknowledged) {
    let categories = products.map((item) => item.product.category);
    categories = categories.map((id) => new ObjectId(id));
    const availableCoupons = await couponSchema.find({
      validFor: { $in: categories },
      validTo: { $gt: Date.now() },
    });

    return availableCoupons;
  }
};

module.exports.checkProductQuantity = async (totalQuantityByProduct) => {
  for (let item of totalQuantityByProduct) {
    const product = await productSchema.findOne(
      { _id: new ObjectId(item.productId) },
      { _id: 0, quantity: 1, productName: 1 }
    );
    const check = product.quantity - item.quantity;
    if (check >= 0) {
      return true;
    } else {
      return product.productName;
    }
  }
};

module.exports.addCartQuantityCheck = (cart, productId) => {
  const matchingProducts = cart.cartItems.filter((item) =>
    item.productId.equals(productId)
  );

  const totalQuantity = matchingProducts.reduce((acc, item) => {
    return acc + item.quantity;
  }, 0);
  console.log(totalQuantity);

  return totalQuantity;
};

module.exports.couponHelper = async (userId, code) => {
  try {
    const couponCheck = await couponSchema.findOne({ couponCode: code });
    console.log(couponCheck);
    if (couponCheck === " ") {
      return { status: false, message: "invalid coupon" };
    }
    if (couponCheck.isExpired) {
      return {
        status: false,
        message: "Coupon Expired or not available at the moment",
      };
    }
    const checkApplied = await orderSchema.findOne({
      userId: new ObjectId(userId),
      couponApplied: code,
    });
    if (checkApplied) {
      return {
        status: false,
        message: "coupon already applied in another order",
      };
    }

    const validCouponProducts = await cartSchema.aggregate([
      { $match: { userId: new ObjectId(userId) } },
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
        $addFields: {
          totalPrice: { $multiply: ["$cartItems.quantity", "$product.price"] },
        },
      },
      {
        $group: {
          _id: "$_id",
          subTotal: { $sum: "$totalPrice" },
          products: { $push: {product:"$product",productTotal:"$totalPrice"} },
        },
      },
      { $unwind: "$products" },
      { $match: { "products.product.category": new ObjectId(couponCheck.validFor) } },
    ]);
    if (validCouponProducts.length === 0) {
      return { status: false, message: "coupon not valid for the products" };
    } else {
      //console.log(validCouponProducts);
      return {
        discountPercent: couponCheck.discountPercentage,
        validCouponProducts: validCouponProducts,
        subTotal: validCouponProducts[0].subTotal,
        minimumPurchaseAmount: couponCheck.minimumPurchaseAmount,
        maximumDiscount: couponCheck.maximumDiscount,
      };
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.subTotalHelp = async (userId) => {
  const subtotal = await cartSchema.aggregate([
    { $match: { userId: new ObjectId(userId) } },
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
      $addFields: {
        orderTotal: { $multiply: ["$cartItems.quantity", "$product.price"] },
      },
    },
    { $group: { _id: "$_id", subTotal: { $sum: "$orderTotal" } } },
  ]);

  return subtotal[0].subTotal;
};
