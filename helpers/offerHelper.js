const categorySchema = require("../models/categoryModel");
const offerSchema = require("../models/offerModel");
const productSchema = require("../models/productModel");
const { ObjectId } = require("mongodb");

module.exports.categoryOfferProducts = async (categoryIds, discount) => {
try {
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
} catch (error) {
  console.error(error);
}
};

module.exports.productOfferProducts = async (productIds, discount) => {
try {
  const fetchProducts = await productSchema.find({ _id: { $in: productIds } });
  const products = fetchProducts.map((product) => {
    const offerPrice = product.price - (product.price * discount) / 100;
    const roundedPrice = Math.ceil(offerPrice);
    return { productId: product._id, offerPrice: roundedPrice };
  });
  console.log(products);
  return products;
} catch (error) {
  console.error(error);
}
};

module.exports.getOffersHelp = async () => {
try {
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
} catch (error) {
  console.error(error);
}
};

module.exports.updateProducts = async (products, validTill) => {
  try {
    const updates = [];
    products.forEach((product) => {
      updates.push({
        updateOne: {
          filter: { _id: product.productId },
          update: {
            $set: {
              "offer.offerStatus": true,
              "offer.offerPrice": product.offerPrice,
              "offer.validTill": new Date(validTill)
            }
          }
        }
      });
    });

    const updateProducts = await productSchema.bulkWrite(updates);
    return updateProducts
  } catch (error) {
    console.error(error);
  }
};

