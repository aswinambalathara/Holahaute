const productSchema = require("../models/productModel");
const categorySchema = require("../models/categoryModel");
const offerHelper = require("../helpers/offerHelper");
const offerSchema = require("../models/offerModel");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

module.exports.getAdminOffers = async (req, res) => {
  try {
    const updateOffers = await offerHelper.updateOffers();
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
    const products = await productSchema.find({ isDeleted: false });
    res.render("admin/addOffer", {
      title: "Add Offer",
      categories: categories,
      products: products,
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
      let offerCategoriesArray = [];
      const {
        offerName,
        validFrom,
        validTo,
        offerCategories,
        discountPercent,
      } = req.body;

      if (typeof offerCategories !== "object") {
        offerCategoriesArray.push(offerCategories);
      } else {
        offerCategoriesArray = offerCategories;
      }

      const products = await offerHelper.categoryOfferProducts(
        offerCategoriesArray,
        Number(discountPercent)
      );
      if (products) {
        const newOffer = new offerSchema({
          offerName: offerName,
          validFrom: new Date(validFrom),
          validTo: new Date(validTo),
          discount: Number(discountPercent),
          offerType: offerType,
          offerItems: offerCategoriesArray,
        });
        const addOffer = await newOffer.save();
        //console.log(addOffer);
        const offerId = addOffer._id;
        const updateProducts = await offerHelper.updateProducts(
          products,
          offerId
        );
        // console.log(updateProducts);
        if (updateProducts) {
          req.flash("success", "Offer Added");
          return res.redirect("/admin/offers");
        }
      }
    } else {
      let offerProductsArray = [];
      const { offerName, validFrom, validTo, offerProducts, discountPercent } =
        req.body;

      if (typeof offerProducts !== "object") {
        offerProductsArray.push(offerProducts);
      } else {
        offerProductsArray = offerProducts;
      }
      const products = await offerHelper.productOfferProducts(
        offerProductsArray,
        Number(discountPercent)
      );
      if (products) {
        const newOffer = new offerSchema({
          offerName: offerName,
          validFrom: new Date(validFrom),
          validTo: new Date(validTo),
          discount: Number(discountPercent),
          offerType: offerType,
          offerItems: offerProductsArray,
        });
        const addOffer = await newOffer.save();
        if (addOffer) {
          const offerId = addOffer._id;
          const updateProducts = await offerHelper.updateProducts(
            products,
            offerId
          );
          if (updateProducts) {
            req.flash("success", "Offer Added");
            res.redirect("/admin/offers");
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports.getEditOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const offer = await offerSchema.findOne({ _id: offerId });
    const categories = await categorySchema.find({ status: true });
    const products = await productSchema.find({ isDeleted: false });

    if (offer) {
      res.render("admin/editoffer", {
        title: "Edit offer",
        offer: offer,
        categories: categories,
        products: products,
        error : req.flash('error')
      });
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports.doEditOffer = async (req, res) => {
  try {
    console.log(req.body);
    const offerId = req.params.id;
    console.log(offerId)
    const {
      offerName,
      discountPercent,
      validFrom,
      validTo,
      offerProducts,
      offerCategories,
    } = req.body;
    const offerCheck = await offerSchema.findOne({ offerName: offerName });
    if (offerCheck && offerCheck._id.toString() !== offerId) {
      if (offerCheck.isExpired === false) {
        req.flash("error", "OfferName already exist with another offer");
        return res.redirect(`/admin/offers/editOffer/${offerId}`);
      }
      await offerSchema.deleteOne({ _id: offerId });
    } else {
      let offerItems = [];
      if (offerProducts) {
        if (typeof offerProducts !== "object") {
          offerItems.push(offerProducts);
        } else {
          offerItems = offerProducts;
        }
        const products = await offerHelper.productOfferProducts(
          offerItems,
          Number(discountPercent)
        );
        if (products) {
          const updateOffer = await offerSchema.updateOne(
            { _id: offerId },
            {
              $set: {
                offerName: offerName ? offerName : undefined,
                validFrom: validFrom ? new Date(validFrom) : undefined,
                validTo: validTo ? new Date(validTo) : undefined,
                discount: discountPercent ? Number(discountPercent) : undefined,
                offerItems: offerItems ? offerItems : undefined,
                isExpired : false
              },
            }
          );
          if (updateOffer) {
            const updateProducts = await offerHelper.updateProducts(
              products,
              offerId
            );
            if (updateProducts) {
              req.flash("success", "Offer Updated");
              res.redirect("/admin/offers");
            }
          }
        }
      } else if (offerCategories) {
        if (typeof offerCategories !== "object") {
          offerItems.push(offerCategories);
        } else {
          offerItems = offerCategories;
        }
      }

      console.log(offerItems)
      const products = await offerHelper.categoryOfferProducts(
        offerItems,
        Number(discountPercent)
      );
      console.log(products)
      if (products) {
        const updateOffer =  await offerSchema.updateOne(
          { _id: offerId },
          {
            $set: {
              offerName: offerName ? offerName : undefined,
              validFrom: validFrom ? new Date(validFrom) : undefined,
              validTo: validTo ? new Date(validTo) : undefined,
              discount: discountPercent ? Number(discountPercent) : undefined,
              offerItems: offerItems ? offerItems : undefined,
              isExpired : false
            },
          }
        );
        if(updateOffer){
          const updateProducts = await offerHelper.updateProducts(products,offerId);
          if(updateProducts){
            req.flash('success',"Offer Updated");
            return res.redirect('/admin/offers');
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports.doUnlistOffer = async (req, res) => {
  try {
    const offerId = req.params.id
    //console.log(offerId);
    if(offerId){
      const unlist = await offerSchema.updateOne({_id:offerId},{$set:{
        isExpired : true
      }});
      console.log(unlist);
      if(unlist){
        return res.json({
          status : true,
          message : "offer updated"
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
};

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
