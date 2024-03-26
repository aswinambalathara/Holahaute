const categorySchema = require("../models/categoryModel");
const productSchema = require("../models/productModel");
const wishlistSchema = require("../models/wishlistModel");
const shopHelper = require("../helpers/shopHelper");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
module.exports.getHomePage = async (req, res) => {
  try {
    let user;
    if (req.cookies.token) {
      user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    }
    const products = await productSchema.find({ isDeleted: false });
    const categories = await categorySchema.find({ status: true });
    res.render("shop/home", {
      title: "Home",
      categories,
      products,
      user: user ? user.userName : undefined,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getProductDetailPage = async (req, res) => {
  try {
    let user;
    if (req.cookies.token) {
      user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    }
    const product = await productSchema.findOne({ _id: req.params.id });
    const relatedProducts = await productSchema.find({
      isDeleted: false,
      _id: { $ne: req.params.id },
    });
    res.render("shop/productDetail", {
      title: product.productName,
      product,
      relatedProducts,
      user: user ? user.userName : undefined,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getProductsPage = async (req, res) => {
  try {
    let user;
    if (req.cookies.token) {
      user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    }
    const categoryIds = await categorySchema.find(
      { status: true },
      { _id: 1, categoryName: 1 }
    );
    const products = await productSchema
      .find({ isDeleted: false })
      .sort({ productName: 1 });

    //console.log(wishlist.wishlistItems);
    res.render("shop/allProducts", {
      title: "All Products",
      products,
      user: user ? user.userName : undefined,
      categories: categoryIds,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doSearch = async (req, res) => {
  try {
    const { searchTerm } = req.body;
    const suggestions = await productSchema.find({
      isDeleted: false,
      $or: [
        { productName: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
    });
    res.json({
      suggestions: suggestions,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doFilter = async (req, res) => {
  try {
    const { colors, userType, sort, price, category } = req.body;
    //console.log(colors,userType,sort,price,category);
    if (colors.length > 0 || userType.length > 0) {
      const results = await shopHelper.filterHelp(
        userType,
        colors,
        sort,
        price,
        category
      );
      //console.log(results);
      res.json({
        status: true,
        results: results,
      });
    } else {
      const results = await shopHelper.defaultFilterHelp(sort, price, category);
      //console.log(results);
      res.json({
        status: true,
        results: results,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getWishlist = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const userId = authUser.userId;
    const wishlist = await shopHelper.getWishlistHelp(userId);
    console.log(wishlist.products[0]);
    res.render("shop/wishlist.ejs", {
      title: "Wishlist",
      user: authUser.userName,
      wishlist,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.addToWishlist = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const userId = authUser.userId;
    const { productId } = req.body;
    const wishlist = await wishlistSchema.findOne({ userId: userId });
    if (wishlist) {
      // check product already exist
      const exist = wishlist.wishlistItems.find((item) => {
        return item.productId.equals(productId);
      });
      if (exist) {
        return res.json({
          status: false,
          message: "Product already exist in wishlist",
        });
      }
      const added = await wishlistSchema.updateOne(
        { userId: userId },
        {
          $push: {
            wishlistItems: {
              productId: productId,
            },
          },
        }
      );
      if (added) {
        res.json({
          status: true,
          message: "Product added to cart",
        });
      }
    } else {
      const newWishlist = new wishlistSchema({
        userId: userId,
        wishlistItems: [{ productId: productId }],
      });
      const added = await newWishlist.save();
      if (added) {
        res.json({
          status: true,
          message: "Added to wishlist",
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.removeFromWishList = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const userId = authUser.userId;
    const { productId } = req.body;

    const removed = await wishlistSchema.updateOne(
      { userId: userId },
      { $pull: { wishlistItems: { productId: productId } } }
    );

    if(removed){
      return res.json({
        status : true,
        message : "Product Removed"
      })
    }

  } catch (error) {
    console.log(error);
  }
};

module.exports.fetchProductOptions = async (req,res)=>{
  try {
    const productId = req.params.id
    const product = await productSchema.findOne({_id:productId});
    //console.log(product);
    if(product){
      return res.json({
        status : true,
        product : product
      })
    }
  } catch (error) {
    console.log(error)
  }
}
