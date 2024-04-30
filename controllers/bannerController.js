const bannerSchema = require("../models/bannerModel");
const categoryModel = require("../models/categoryModel");
const productModel = require("../models/productModel");
const bannerHelper = require("../helpers/bannerHelper");
const fs = require("fs");

module.exports.getBannerManagement = async (req, res,next) => {
  try {
    const today = Date.now();
    const updateBanners = await bannerSchema.updateMany(
      { validTo: { $lt: today } },
      {
        $set: {
          status: false,
        },
      }
    );
    const banners = await bannerSchema.find({});
    res.render("admin/bannerManagement", {
      title: "Banners",
      banners,
      error: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.getAddBanner = async (req, res,next) => {
  try {
    const products = await productModel.find({ isDeleted: false });
    const categories = await categoryModel.find({ status: true });
    //console.log(products)
    res.render("admin/addBanner", {
      title: "Add Banner",
      products: products,
      categories: categories,
      error : req.flash('error')
    });
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.doAddBanner = async (req, res,next) => {
  try {
    console.log(req.body);
    console.log(req.file);
    const { bannerName, bannerType, product, category, validFrom, validTo } =
      req.body;
    const { filename } = req.file;
    const bannerCheck = await bannerSchema.findOne({
      name: bannerName.toLowerCase(),
    });
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
    console.error(error)
    next(error)
  }
};

module.exports.getEditBanner = async (req, res,next) => {
  try {
    const bannerId = req.params.id;
    console.log(bannerId);
    const banner = await bannerSchema.findOne({ _id: bannerId });
    const products = await productModel.find({ isDeleted: false });
    const categories = await categoryModel.find({ status: true });
    res.render("admin/editBanner", {
      title: "Edit Banner",
      products: products,
      categories: categories,
      banner,
      error : req.flash('error')
    });
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.doEditBanner = async (req, res,next) => {
  try {
    const bannerId = req.params.id;
    const { bannerName, bannerType, product, category, validFrom, validTo } =
      req.body;
    const file = req.file ? req.file.filename : undefined;
    const bannerCheck = await bannerSchema.findOne({
      name: bannerName.toLowerCase(),
      _id: { $ne: bannerId },
    });
    if (bannerCheck) {
      if (bannerCheck.status === true) {
        req.flash("error", "Banner already exist with name");
        return res.redirect(`/admin/banners/editbanner/${bannerId}`);
      }
      fs.unlink(`public/images/banners/${bannerCheck.bannerImage}`, (error) => {
        if (error) {
          console.log(error);
        } else {
          console.log(`${bannerCheck.bannerImage} deleted`);
        }
      });
      await bannerSchema.deleteOne({ _id: bannerCheck._id });
    }

    const targetItem = bannerType === "categoryBanner" ? category : product;
    const targetURL = await bannerHelper.generateTargetUrl(
      bannerType,
      targetItem
    );
    console.log(targetURL);
    const updateBanner = await bannerSchema.updateOne(
      { _id: bannerId },
      {
        $set: {
          name: bannerName ? bannerName.toLowerCase() : undefined,
          bannerType: bannerType ? bannerType : undefined,
          targetItem: targetItem,
          validFrom: validFrom ? new Date(validFrom) : undefined,
          validTo: validTo ? new Date(validTo) : undefined,
          bannerImage: file,
          targetURL: targetURL,
          status: true,
        },
      }
    );
    if (updateBanner) {
      req.flash("success", "Banner Updated");
      return res.redirect("/admin/banners");
    }
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.doUnlistBanner = async (req, res,next) => {
  try {
    const bannerId = req.params.id;
    console.log(bannerId);
    if (bannerId) {
      const unList = await bannerSchema.updateOne(
        { _id: bannerId },
        {
          $set: {
            status: false,
          },
        }
      );
      return res.json({
        status: true,
        message: "Updates Successfull",
      });
    }
  } catch (error) {
    console.error(error)
    next(error)
  }
};
