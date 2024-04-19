const { ObjectId } = require("mongodb");
const productSchema = require("../models/productModel");
const wishlistSchema = require("../models/wishlistModel");

module.exports.filterHelp = async (
  userTypes,
  colors,
  sort,
  price,
  category,
  searchTerm
) => {
  let sortFilter;
  let priceFilter;
  const today = new Date()
  if (sort === "ascendingOrder") {
    sortFilter = { productName: 1 };
  } else if (sort === "descendingOrder") {
    sortFilter = { productName: -1 };
  } else if (sort === "newArrivals") {
    sortFilter = { createdAt: -1 };
  } else if (sort === "lowToHigh") {
    sortFilter = { price: 1 };
  } else if (sort === "highToLow") {
    sortFilter = { price: -1 };
  } else if (sort === "averageRating") {
    sortFilter = { averageRating: -1 };
  }

  if (price === "allPrices") {
    priceFilter = { $gt: 0 };
  } else if (price === "priceBelow500") {
    priceFilter = { $gt: 0, $lte: 500 };
  } else if (price === "priceRange500_2000") {
    priceFilter = { $gt: 500, $lte: 2000 };
  } else if (price === "priceRange2000_5000") {
    priceFilter = { $gt: 2000, $lte: 5000 };
  } else if (price === "priceAbove5000") {
    priceFilter = { $gt: 5000 };
  }

  const products = await productSchema.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $lookup: {
        from: "ratings",
        localField: "_id",
        foreignField: "productId",
        as: "ratings",
      },
    },
    {
      $lookup: {
        from: "offers",
        localField: "offer.offerId",
        foreignField: "_id",
        as: "availableOffer",
      },
    },
    {
      $addFields: {
        averageRating: { $avg: "$ratings.rating" },
        offerExist : {$ne:["$availbleOffer",[]]},
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
      $match: {
        $and: [
          { "category.categoryName": category ? category : { $exists: true } },
          { price: priceFilter },
        ],
        $or: [{ userType: { $in: userTypes } }, { color: { $in: colors } }],
      },
    },
    {
      $match: {
        $or: [
          { productName: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
        ],
      },
    },
    { $sort: sortFilter },
    {
      $project: {
        productName: 1,
        images: 1,
        price: 1,
        offerStatus: 1,
        offer: {
          $cond: {
            if: { $eq: ["$offerStatus", true] },
            then: {
              currentPrice: "$offer.offerPrice",
              discount: "$availableOffer.discount",
            },
            else: { currentPrice: "$price" },
          },
        },
      },
    },
  ]); 
 // console.log(products);
  return products;
};

module.exports.defaultFilterHelp = async (
  sort,
  price,
  category,
  searchTerm
) => {
  let sortFilter;
  let priceFilter;
  const today = new Date()
  if (sort === "ascendingOrder") {
    sortFilter = { productName: 1 };
  } else if (sort === "descendingOrder") {
    sortFilter = { productName: -1 };
  } else if (sort === "newArrivals") {
    sortFilter = { createdAt: -1 };
  } else if (sort === "lowToHigh") {
    sortFilter = { price: 1 };
  } else if (sort === "highToLow") {
    sortFilter = { price: -1 };
  } else if (sort === "averageRating") {
    sortFilter = { averageRating: -1 };
  }

  if (price === "allPrices") {
    priceFilter = { $gt: 0 };
  } else if (price === "priceBelow500") {
    priceFilter = { $gt: 0, $lte: 500 };
  } else if (price === "priceRange500_2000") {
    priceFilter = { $gt: 500, $lte: 2000 };
  } else if (price === "priceRange2000_5000") {
    priceFilter = { $gt: 2000, $lte: 5000 };
  } else if (price === "priceAbove5000") {
    priceFilter = { $gt: 5000 };
  }

  const products = await productSchema.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $lookup: {
        from: "ratings",
        localField: "_id",
        foreignField: "productId",
        as: "ratings",
      },
    },
    {
      $lookup: {
        from: "offers",
        localField: "offer.offerId",
        foreignField: "_id",
        as: "availableOffer",
      },
    },
    {
      $addFields: {
        averageRating: { $avg: "$ratings.rating" },
        offerExist : {$ne:["$availbleOffer",[]]},
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
      $match: {
        $and: [
          { "category.categoryName": category ? category : { $exists: true } },
          { price: priceFilter },
        ],
        $or: [
          { productName: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
        ],
      },
    },
    { $sort: sortFilter },
    {
      $project: {
        productName: 1,
        images: 1,
        price: 1,
        offerStatus: 1,
        offer: {
          $cond: {
            if: { $eq: ["$offerStatus", true] },
            then: {
              currentPrice: "$offer.offerPrice",
              discount: "$availableOffer.discount",
            },
            else: { currentPrice: "$price" },
          },
        },
      },
    },
  ]);
 // console.log(products);
  return products;
};

module.exports.getWishlistHelp = async (userId) => {
  const today = new Date();
  const wishlist = await wishlistSchema.aggregate([
    { $match: { userId: new ObjectId(userId) } },
    {
      $lookup: {
        from: "products",
        localField: "wishlistItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind : "$product"
    },
    {
      $project:{
        //wishlistItems : 1,
        products:{
          $mergeObjects : ["$$ROOT.product","$product.offer"]
        }
      } 
    },
    {
      $lookup :{
        from : "offers",
        localField : "products.offerId",
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
      $sort: { productName: 1 },
    },
    {
      $project : {
        productName : "$products.productName",
        productId : "$products._id",
        description : "$products.description",
        quantity : "$products.quantity",
        price : "$products.price",
        images : "$products.images",
        userType : "$products.userType",
        color : "$products.color",
        sizeOptions : "$products.sizeOptions",
        offerStatus : 1,
        offer: {
          $cond: {
            if: { $eq: ["$offerStatus", true] },
            then: {
              currentPrice: "$products.offerPrice",
              discount: "$availableOffer.discount",
            },
            else: { currentPrice: "$products.price" },
          },
        },
      }
    }
  ]);
//console.log(wishlist)
  return wishlist;
};

module.exports.getProductDetailHelp = async (productId) => {
  const today = new Date();
  const product = await productSchema.aggregate([
    {
      $match: { _id: new ObjectId(productId) },
    },
    {
      $lookup: {
        from: "offers",
        localField: "offer.offerId",
        foreignField: "_id",
        as: "availableOffer",
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
                if: {
                  $gte: [
                    { $arrayElemAt: ["$availableOffer.validTo", 0] },
                    today,
                  ],
                },
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
        productName: 1,
        description: 1,
        category: 1,
        images: 1,
        price: 1,
        userType: 1,
        color: 1,
        sizeOptions: 1,
        additionalInformation: 1,
        quantity: 1,
        offer: {
          $cond: {
            if: { $eq: ["$offerStatus", true] },
            then: {
              currentPrice: "$offer.offerPrice",
              discount: { $arrayElemAt: ["$availableOffer.discount", 0] },
            },
            else: { currentPrice: "$price" },
          },
        },
      },
    },
  ]);
  //console.log(product[0]);
  return product[0];
};

module.exports.getProductsHelp = async () => {
  const today = new Date();
  const products = await productSchema.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "offers",
        localField: "offer.offerId",
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
      $sort: { productName: 1 },
    },
    {
      $project: {
        productName: 1,
        images: 1,
        price: 1,
        offerStatus: 1,
        offer: {
          $cond: {
            if: { $eq: ["$offerStatus", true] },
            then: {
              currentPrice: "$offer.offerPrice",
              discount: "$availableOffer.discount",
            },
            else: { currentPrice: "$price" },
          },
        },
      },
    },
  ]);
  //console.log(products);
  return products;
};

module.exports.getRelatedProducts = async (productId) => {
  const today = new Date();
  const relatedProducts = await productSchema.aggregate([
    {
      $match: {
        isDeleted: false,
        _id: { $ne: productId },
      },
    },
    {
      $lookup: {
        from: "offers",
        localField: "offer.offerId",
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
        productName: 1,
        images: 1,
        price: 1,
        offerStatus: 1,
        offer: {
          $cond: {
            if: { $eq: ["$offerStatus", true] },
            then: {
              currentPrice: "$offer.offerPrice",
              discount: "$availableOffer.discount",
            },
            else: { currentPrice: "$price" },
          },
        },
      },
    },
  ]);

  //console.log(relatedProducts);
  return relatedProducts;
};
