const categorySchema = require("../models/categoryModel");
const offerSchema = require("../models/offerModel");
const productSchema = require("../models/productModel");
const { ObjectId } = require("mongodb");

module.exports.categoryOfferProducts = async (categoryIds, discount) => {
  const products = await productSchema.aggregate([
    {
      $match: { category: { $in: categoryIds.map((id) => new ObjectId(id)) } },
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
      },
    },
    {
      $project: { offerPrice: "$roundedOfferPrice", productId: "$_id", _id: 0 },
    },
  ]);
  console.log(products);
  return products;
};

module.exports.productOfferProducts = async (productIds, discount) => {
  const fetchProducts = await productSchema.find({ _id: { $in: productIds } });
  const products = fetchProducts.map((product) => {
    const offerPrice = product.price - (product.price * discount) / 100;
    const roundedPrice = Math.ceil(offerPrice);
    return { productId: product._id, offerPrice: roundedPrice };
  });
  console.log(products);
  return products;
};

module.exports.getOffersHelp = async () => {
  const offers = await offerSchema.aggregate([
    { $match: { isExpired: false } },
    { $unwind: "$offerProducts" },
    {
      $lookup: {
        from: "products",
        localField: "offerProducts.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: {
        _id: "$_id",
        offerName: { $first: "$offerName" },
        discount: { $first: "$discount" },
        products: {
          $push: {
            productName: "$product.productName",
            productId : "$product._id",
            originalPrice: "$product.price",
            offerPrice: "$offerProducts.offerPrice",
            productImage : "$product.images"
          },
        },
      },
    },
  ]);

   console.log(offers[0]);
  return offers
};

