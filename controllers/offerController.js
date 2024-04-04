const productSchema = require("../models/productModel");
const categorySchema = require("../models/categoryModel");

module.exports.getAdminOffers = (req, res) => {
  try {
    res.render('admin/adminOffers',{title:"Offers"})
  } catch (error) {
    console.error(error);
  }
}; 
module.exports.getAddOffer = (req, res) => {};
module.exports.doAddOffer = (req, res) => {};
module.exports.getEditOffer = (req, res) => {};
module.exports.doEditOffer = (req, res) => {};
module.exports.doDeleteOffer = (req, res) => {};

module.exports.getOffers = (req, res) => {};
