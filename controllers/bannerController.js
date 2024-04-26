const bannerSchema = require("../models/bannerModel");

module.exports.getAdminManagement = async (req, res) => {
  try {
    const banners = await bannerSchema.find({});
    res.render('admin/bannerManagement',{title:"Banners",banners});
  } catch (error) {
    console.error(error)
  }
};
 