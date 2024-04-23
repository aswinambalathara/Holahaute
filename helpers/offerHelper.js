const categorySchema = require("../models/categoryModel");
const offerSchema = require("../models/offerModel");
const productSchema = require("../models/productModel");
const { ObjectId } = require("mongodb");

module.exports.categoryOfferProducts = async (categoryIds, discount) => {
  try {
    const products = await productSchema.aggregate([
      {
        $match: {
          category: { $in: categoryIds.map((id) => new ObjectId(id)) },
        },
      },
      {
        $addFields: {
          offerPrice: {
            $subtract: [
              "$price",
              { $divide: [{ $multiply: ["$price", discount] }, 100] },
            ],
          },
        },
      },
      {
        $addFields: {
          roundedOfferPrice: { $ceil: "$offerPrice" },
          offerStatus: {
            $cond: { if: { $eq: ["$offer", null] }, then: false, else: true },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["$offerStatus", true] },
              { $gte: ["$offer.offerPrice", "$roundedOfferPrice"] },
            ]
          }
        },
      },
      {
        $project: {
          productId: "$_id",
          price: 1,
          productName: 1,
          offerPrice: "$roundedOfferPrice",
          offer: 1,
          _id: 0,
        },
      },
    ]);
    // console.log(products);
    return products;
  } catch (error) {
    console.error(error);
  }
};

module.exports.productOfferProducts = async (productIds, discount) => {
  try {
    const products = await productSchema.aggregate([
      {
        $match: { _id: { $in: productIds.map((id) => new ObjectId(id)) } },
      },
      {
        $addFields: {
          offerPrice: {
            $subtract: [
              "$price",
              { $divide: [{ $multiply: ["$price", discount] }, 100] },
            ],
          },
        },
      },
      {
        $addFields: {
          roundedOfferPrice: { $ceil: "$offerPrice" },
          offerStatus: {
            $cond: { if: { $eq: ["$offer", null] }, then: false, else: true },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["$offerStatus", true] },
              { $gte: ["$offer.offerPrice", "$roundedOfferPrice"] },
            ]
          }
        },
      },
      {
        $project: {
          productId: "$_id",
          price: 1,
          productName: 1,
          offerPrice: "$roundedOfferPrice",
          offer: 1,
          _id: 0,
        },
      },
    ]);
    console.log(products);
    return products;
  } catch (error) {
    console.error(error);
  }
};

module.exports.getOffersHelp = async () => {
  try {
    const today = new Date();
    console.log(today);
    const offers = await productSchema.aggregate([
      {
        $lookup: {
          from: "offers",
          localField: "offer.offerId",
          foreignField: "_id",
          as: "availableOffer",
        },
      },
      {
        $unwind: "$availableOffer",
      },
      {
        $match: { "availableOffer.validTo": { $gte: today } },
      },
      {
        $group: {
          _id: "$offer.offerId",
          offer: {
            $addToSet: {
              offerName: "$availableOffer.offerName",
              discount: "$availableOffer.discount",
            },
          },
          products: {
            $push: {
              productName: "$productName",
              offerPrice: "$offer.offerPrice",
              productId: "$_id",
              productPrice: "$price",
              images: "$images",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          offer: { $arrayElemAt: ["$offer", 0] },
          products: 1,
        },
      },
    ]);
    console.log(offers);
    return offers;
  } catch (error) {
    console.error(error);
  }
};

module.exports.updateProducts = async (products, offerId) => {
  try {
    const updates = [];
    products.forEach((product) => {
      updates.push({
        updateOne: {
          filter: { _id: product.productId },
          update: {
            $set: {
              "offer.offerPrice": product.offerPrice,
              "offer.offerId": offerId,
            },
          },
        },
      });
    });

    const updateProducts = await productSchema.bulkWrite(updates);
    return updateProducts;
  } catch (error) {
    console.error(error);
  }
};

module.exports.updateOffers = async ()=>{
  try {
    const today = new Date()
    await offerSchema.updateMany({validTo:{$lt:today}},{$set:{
      isExpired : true
    }
    });
  } catch (error) {
    console.error(error);
  }
}
