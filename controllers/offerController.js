const productSchema = require("../models/productModel");
const categorySchema = require("../models/categoryModel");

module.exports.getAdminOffers = async (req, res) => {
  try {
    res.render("admin/adminOffers", {
      title: "Offers",
    });
  } catch (error) {
    console.error(error);
  }
};
module.exports.getAddOffer = async (req, res) => {
  try {
    const categories = await categorySchema.find({ status: true });
    res.render("admin/addOffer", { title: "Add Offer",categories: categories,});
  } catch (error) {
    console.error(error);
  }
};
module.exports.doAddOffer = (req, res) => {};
module.exports.getEditOffer = (req, res) => {};
module.exports.doEditOffer = (req, res) => {};
module.exports.doDeleteOffer = (req, res) => {};

module.exports.getOffers = async (req, res) => {
  try {
    let user;
    if (req.cookies.token) {
      user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    }
    res.render("shop/offers", {
      title: "Offers",
      user: user ? user.userName : undefined,
      wishlistCount: user ? req.session.wishlistCount : 0,
      cartCount: user ? req.session.cartCount : 0,
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.fetchProductList = async (req, res) => {
  try {
    console.log(req.body);
    const { categoryId } = req.body;
    const products = await productSchema.find({category:categoryId});
    if(products){
      return res.json({
        status : true,
        products : products
      })
    }
  } catch (error) {
    console.error(error);
  }
};
