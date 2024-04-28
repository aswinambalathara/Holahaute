const bannerSchema = require("../models/bannerModel");

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
    
  } catch (error) {
    console.error(error)
  }
}

module.exports.doAddBanner = async (req,res) => {
  try {
    
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
