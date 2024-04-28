const categorySchema = require("../models/categoryModel");
const productSchema = require("../models/productModel");
const productHelper = require("../helpers/productHelper");
const fs = require("fs");
const { json } = require("express");
const { error } = require("console");

module.exports.getAdminProducts = async (req, res) => {
  try {
    const products = await productSchema
      .find({ isDeleted: false })
      .populate("category");
    res.render("admin/adminProducts", {
      title: "Products",
      products,
      success: req.flash("success"),
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.getAddProducts = async (req, res) => {
  try {
    const categories = await categorySchema.find({ status: true });
    res.render("admin/addProduct", {
      title: "Add Product",
      categories,
      err: req.flash("error"),
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.doAddProducts = async (req, res) => {
  try {
    const images = productHelper.imageNameArray(req.files);
    //console.log(images);
    const newProductName = req.body.productName.toLowerCase();
    const colors = JSON.parse(req.body.colors);
    //console.log(req.body.colors);
    //console.log(colors)
    const productCheck = await productSchema.findOne({
      productName: newProductName,
    });
    if (productCheck) {
      if (productCheck.isDeleted === false) {
        req.flash("error", "This Product with product Name already Exist");
        for (let file of req.files) {
          fs.unlink(
            `public/images/product-images/${file.filename}`,
            (error) => {
              if (error) {
                console.log(error);
              } else {
                console.log(`${file.filename} is deleted`);
              }
            }
          );
        }
        res.redirect("/admin/products/addproduct");
      } else {
        for (let image of productCheck.images) {
          fs.unlink(`public/images/product-images/${image}`, (error) => {
            if (error) {
              console.log(error);
            } else {
              console.log(`${image} is deleted`);
            }
          });
        }
        await productSchema.updateOne(
          { productName: newProductName },
          {
            $set: {
              category: req.body.category,
              price: req.body.price,
              quantity: req.body.quantity,
              userType: req.body.userType,
              color: colors,
              sizeOptions: req.body.sizeOptions,
              description: req.body.description,
              additionalInformation: req.body.additionalInformation,
              images: images,
              isDeleted : false
            },
          }
        );
        res.redirect("/admin/products");
      }
    } else {
      const product = new productSchema({
        productName: req.body.productName.toLowerCase(),
        category: req.body.category,
        price: req.body.price,
        quantity: req.body.quantity,
        userType: req.body.userType,
        color: colors,
        sizeOptions: req.body.sizeOptions,
        description: req.body.description,
        additionalInformation: req.body.additionalInformation,
        images: images,
      });
      await product.save();
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports.getEditProducts = async (req, res) => {
  try {
    const product = await productSchema
      .findOne({ _id: req.params.id })
      .populate("category");
    //console.log(product)
    const categories = await categorySchema.find({ status: true });
    res.render("admin/editProduct.ejs", {
      title: "Edit Product",
      categories,
      product: product,
      err: req.flash("error"),
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.doEditProducts = async (req, res) => {
  try {
    const newProductName = req.body.productName.toLowerCase();
    const existedImages = JSON.parse(req.body.existedImages);
    const colors = JSON.parse(req.body.colors);

    const productCheck = await productSchema.findOne({
      productName: newProductName,
    });

    const product = await productSchema.findOne({ _id: req.params.id });
    const files = req.files.length > 0 ? req.files : undefined;
    let images = await productHelper.editImagesArray(files, existedImages);

    console.log(images);

    if (productCheck && product.productName !== newProductName) {
      if (productCheck.isDeleted === false) {
        req.flash("error", "This Product with product name already exist");
        for (let image of files.filename) {
          fs.unlink(`public/images/product-images/${image}`, (error) => {
            if (error) {
              console.log(error);
            } else {
              console.log(`${image} is deleted part a`);
            }
          });
        }
        res.redirect(`/admin/products/editproduct/${product._id}`);
      } else {
        for (let image of productCheck.images) {
          fs.unlink(`public/images/product-images/${image}`, (error) => {
            if (error) {
              console.log(error);
            } else {
              console.log(`${image} is deleted part b`);
            }
          });
        }
        await productSchema.deleteOne({
          productName: newProductName,
          isDeleted: true,
        });

        for (let image of product.images) {
          if (!existedImages.includes(image)) {
            fs.unlink(`public/images/product-images/${image}`, (error) => {
              if (error) {
                console.log(error);
              } else {
                console.log(`${image} is deleted part c`);
              }
            });
          }
        }

        await productSchema.updateOne(
          { _id: req.params.id },
          {
            $set: {
              productName:
                req.body.productName !== ""
                  ? req.body.productName.toLowerCase()
                  : undefined,
              category:
                req.body.category !== "" ? req.body.category : undefined,
              price: req.body.price !== "" ? req.body.price : undefined,
              quantity:
                req.body.quantity !== "" ? req.body.quantity : undefined,
              userType:
                req.body.userType !== "" ? req.body.userType : undefined,
              color: colors !== "" ? colors : undefined,
              sizeOptions:
                req.body.sizeOptions.length !== 0
                  ? req.body.sizeOptions
                  : undefined,
              description:
                req.body.description !== "" ? req.body.description : undefined,
              additionalInformation:
                req.body.additionalInformation !== ""
                  ? req.body.additionalInformation
                  : undefined,
              images: images.length !== 0 ? images : undefined,
            },
          }
        );
        res.redirect("/admin/products");
      }
    } else {
      for (let image of product.images) {
        if (!existedImages.includes(image)) {
          fs.unlink(`public/images/product-images/${image}`, (error) => {
            if (error) {
              console.log(error);
            } else {
              console.log(`${image} is deleted part c`);
            }
          });
        }
      }
      await productSchema.updateOne(
        { _id: req.params.id },
        {
          $set: {
            productName:
              req.body.productName !== ""
                ? req.body.productName.toLowerCase()
                : undefined,
            category: req.body.category !== "" ? req.body.category : undefined,
            price: req.body.price !== "" ? req.body.price : undefined,
            quantity: req.body.quantity !== "" ? req.body.quantity : undefined,
            userType: req.body.userType !== "" ? req.body.userType : undefined,
            color: colors !== "" ? colors : undefined,
            sizeOptions:
              req.body.sizeOptions.length !== 0
                ? req.body.sizeOptions
                : undefined,
            description:
              req.body.description !== "" ? req.body.description : undefined,
            additionalInformation:
              req.body.additionalInformation !== ""
                ? req.body.additionalInformation
                : undefined,
            images: images.length !== 0 ? images : undefined,
          },
        }
      );
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doDeleteProducts = async (req, res) => {
  try {
    if (req.params.id) {
      await productSchema.updateOne(
        { _id: req.params.id },
        {
          $set: {
            isDeleted: true,
          },
        }
      );
      req.flash("success", "Product Deleted");
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
  }
};
