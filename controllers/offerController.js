const productSchema = require("../models/productModel");
const categorySchema = require("../models/categoryModel");
const offerHelper = require("../helpers/offerHelper");
const offerSchema = require("../models/offerModel");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

module.exports.getAdminOffers = async (req, res) => {
  try {
    const offers = await offerSchema.find({});
    res.render("admin/adminOffers", {
      title: "Offers",
      success: req.flash("success"),
      offers: offers,
    });
  } catch (error) {
    console.error(error);
  }
};
module.exports.getAddOffer = async (req, res) => {
  try {
    const categories = await categorySchema.find({ status: true });
    res.render("admin/addOffer", {
      title: "Add Offer",
      categories: categories,
      error: req.flash("error"),
    });
  } catch (error) {
    console.error(error);
  }
};
module.exports.doAddOffer = async (req, res) => {
  try {
    console.log(req.body);
    const { offerType, offerName } = req.body;
    const offer = await offerSchema.findOne({ offerName: offerName });
    if (offer) {
      if (offer.isExpired === false) {
        req.flash("error", "Offer Already exist");
        return res.redirect("/admin/offers/addoffer");
      }
    }
    if (offerType === "categoryOffer") {
      const {
        offerName,
        validFrom,
        validTo,
        offerCategories,
        discountPercent,
      } = req.body;
      const products = await offerHelper.categoryOfferProducts(
        offerCategories,
        Number(discountPercent)
      );
      if (products) {
        const newOffer = new offerSchema({
          offerName: offerName,
          validFrom: new Date(validFrom),
          validTo: new Date(validTo),
          discount: Number(discountPercent),
          offerType: offerType,
          offerProducts: products,
        });
        const addOffer = await newOffer.save();
        console.log(addOffer);
        const updateProducts = await offerHelper.updateProducts(products,validTo);
        if (updateProducts) {
          req.flash("success", "Offer Added");
          return res.redirect("/admin/offers");
        }
      }
    } else {
      const { offerName, validFrom, validTo, offerProducts, discountPercent } =
        req.body;
      const products = await offerHelper.productOfferProducts(
        offerProducts,
        Number(discountPercent)
      );
      if (products) {
        const newOffer = new offerSchema({
          offerName: offerName,
          validFrom: new Date(validFrom),
          validTo: new Date(validTo),
          discount: Number(discountPercent), 
          offerType: offerType,
          offerProducts: products,
        });
        const addOffer = await newOffer.save();
        if (addOffer) {
          req.flash("succes", "Offer Added");
          return res.redirect("/admin/offers");
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};
module.exports.getEditOffer = async (req, res) => {
  try {
    const offerId = req.params.id
    const offer = await offerSchema.findOne({_id:offerId});
    const categories = await categorySchema.find({ status: true });
    if(offer){
      res.render('admin/editoffer',{title:"Edit offer",offer:offer,categories:categories})
    }
  } catch (error) {
    console.error(error)
  }
};
module.exports.doEditOffer = (req, res) => {};
module.exports.doDeleteOffer = (req, res) => {};

module.exports.getOffers = async (req, res) => {
  try {
    let user;
    if (req.cookies.token) {
      user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    }
    const offers = await offerHelper.getOffersHelp();
    if (offers) {
      res.render("shop/offers", {
        title: "Offers",
        user: user ? user.userName : undefined,
        wishlistCount: user ? req.session.wishlistCount : 0,
        cartCount: user ? req.session.cartCount : 0,
        offers: offers,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports.fetchProductList = async (req, res) => {
  try {
    //console.log(req.body);
    const { categoryId } = req.body;
    const products = await productSchema.find({ category: categoryId });
    if (products) {
      return res.json({
        status: true,
        products: products,
      });
    }
  } catch (error) {
    console.error(error);
  }
};
