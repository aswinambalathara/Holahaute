const bannerSchema = require("../models/bannerModel");
const categoryModel = require("../models/categoryModel");
const productModel = require("../models/productModel");

module.exports.getBannerManagement = async (req, res) => {
  try {
    const banners = await bannerSchema.find({});
    res.render('admin/bannerManagement',{title:"Banners",banners});
  } catch (error) {
    console.error(error)
  }
};
 
module.exports.getAddBanner = async (req,res) => {
  try {
    const products = await productModel.find({isDeleted : false});
    const categories = await categoryModel.find({status : true});
    console.log(products)
    res.render('admin/addBanner',{title:"Add Banner",products:products,categories:categories});
  } catch (error) {
    console.error(error)
  }
}

module.exports.doAddBanner = async (req,res) => {
  try {
    console.log(req.body)
    console.log(req.file)
  } catch (error) {
    console.error(error)
  }
}

module.exports.getEditBanner = async (req,res) => {
  try {
    
  } catch (error) {
    console.error(error)
  }
}

module.exports.doEditBanner = async (req,res) => {
  try {
    
  } catch (error) {
    console.error(error)
  }
}
