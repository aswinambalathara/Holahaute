const bannerSchema = require("../models/bannerModel");
const categoryModel = require("../models/categoryModel");
const productModel = require("../models/productModel");
const bannerHelper = require("../helpers/bannerHelper");
const fs = require("fs");

module.exports.getBannerManagement = async (req, res) => {
  try {
    const today = Date.now()
    const updateBanners = await bannerSchema.updateMany({validTo:{$lt:today}},{$set:{
      status : false
    }});
    const banners = await bannerSchema.find({});
    res.render("admin/bannerManagement", { title: "Banners", banners });
  } catch (error) {
    console.error(error);
  }
};

module.exports.getAddBanner = async (req, res) => {
  try {
    const products = await productModel.find({ isDeleted: false });
    const categories = await categoryModel.find({ status: true });
    //console.log(products)
    res.render("admin/addBanner", {
      title: "Add Banner",
      products: products,
      categories: categories,
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.doAddBanner = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.file);
    const { bannerName, bannerType, product, category, validFrom, validTo } =
      req.body;
    const { filename } = req.file;
    const bannerCheck = await bannerSchema.findOne({ name: bannerName.toLowerCase() });
    if (bannerCheck) {
      fs.unlink(`public/images/banners/${filename}`, (error) => {
        if (error) {
          console.log(error);
        } else {
          console.log(`${filename} deleted`);
        }
      });
      req.flash("error", "Banner already exist");
      return res.redirect("/admin/banners/addbanner");
    }

    if (bannerType === "categoryBanner") {
      const targetURL = await bannerHelper.generateTargetUrl(
        bannerType,
        category
      );
      const newBanner = new bannerSchema({
        name: bannerName.toLowerCase(),
        bannerType: bannerType,
        targetItem: category,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        bannerImage: filename,
        targetURL: targetURL,
      });
      const addBanner = await newBanner.save();
      if (addBanner) {
        req.flash("success", "Banner Added");
        return res.redirect("/admin/banners");
      }
    } else {
      const targetURL = await bannerHelper.generateTargetUrl(
        bannerType,
        product
      );
      const newBanner = new bannerSchema({
        name: bannerName.toLowerCase(),
        bannerType: bannerType,
        targetItem: category,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        bannerImage: filename,
        targetURL: targetURL,
      });
      const addBanner = await newBanner.save();
      if (addBanner) {
        req.flash("success", "Banner Added");
        return res.redirect("/admin/banners");
      }
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports.getEditBanner = async (req, res) => {
  try {
    const bannerId = req.params.id
    console.log(bannerId)
    const banner = await bannerSchema.findOne({_id:bannerId})
    const products = await productModel.find({isDeleted : false});
    const categories = await categoryModel.find({status : true});
    res.render("admin/editBanner", {
      title: "Edit Banner",
      products: products,
      categories: categories,
      banner
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.doEditBanner = async (req, res) => {
  try {
    const bannerId = req.params.id
    const {bannerName,bannerType,product,category,validFrom,validTo} = req.body;
    const file = req.file? req.file.filename : undefined
    const bannerCheck = await bannerSchema.findOne({name : bannerName.toLowerCase() , _id:{$ne:bannerId}})
    if(bannerCheck){
      if(bannerCheck.status === true){
        req.flash('error',"Banner already exist with name")
        return res.redirect(`/admin/banners/editbanner/${bannerId}`);
      }
      
    }

    console.log(bannerId)
  } catch (error) {
    console.error(error);
  }
};

module.exports.doUnlistBanner = async (req,res)=>{
  try {
    
  } catch (error) {
    console.error(error);
  }
}
