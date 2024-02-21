const { response } = require("express");
const categorySchema = require("../models/categoryModel");
const fs = require("fs");
const { error } = require("console");
module.exports.getAdminCategory = async (req, res) => {
  const data = await categorySchema.find({ status: true });
  // console.log(data);

  res.render("admin/adminCategory", { title: "Category", data });
};

module.exports.getAddCategory = (req, res) => {
  res.render("admin/addCategory", {
    title: "Add Category",
    err: req.flash("error"),
  });
};

module.exports.doAddCategory = async (req, res) => {
  try {
    const categoryName = req.body.catName.toLowerCase();
    const fileName = req.file.filename;
    if (categoryName && fileName) {
      const categoryCheck = await categorySchema.findOne({ categoryName });
      if (!categoryCheck) {
        const category = new categorySchema({
          categoryName,
          image: fileName,
        });
        await category.save();
        res.redirect("/admin/category");
      } else {
        if(categoryCheck.status === false){
          await categorySchema.updateOne({categoryName},{$set:{
            categoryName : categoryName,
            image : fileName,
            status:true
          }})
          fs.unlink(`public/images/categoryImages/${categoryCheck.image}`,(error)=>{
            if(error){
              console.log(error)
            }else{
              console.log(`${categoryCheck.image} is deleted`);
            }
          })
          res.redirect('/admin/category');
        }else{
          req.flash("error", "Category already exist");
          fs.unlink(`public/images/categoryImages/${fileName}`, (error) => {
            if (error) {
              console.log(error);
            } else {
              console.log(`${fileName} is deleted`);
            }
          });
          res.redirect("/admin/category/addcategory");
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getEditCategory = async (req, res) => {
  try {
    const category = await categorySchema.findOne({ _id: req.params.id });
    if (category) {
      res.render("admin/editCategory", {
        title: "Edit Category",
        category,
        err: req.flash("error"),
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doEditCategory = async (req, res) => {
  try {
    const categoryName = req.body.catName.toLowerCase();
    const category = await categorySchema.findOne({ _id: req.params.id });
    const categoryCheck = await categorySchema.findOne({ categoryName });
    let image = null
    if(req.file){
      image = req.file.filename;
    }
    if (categoryCheck && category.categoryName !== categoryName) {
      if (categoryCheck.status === false) {
        fs.unlink(`public/images/categoryImages/${categoryCheck.image}`,(error)=>{
          if(error){
            console.log(error);
          }else{
            console.log(`${categoryCheck.image} is deleted`);
          }
        });
        await categorySchema.deleteOne({categoryName,status:false});
        if(image){
          await categorySchema.updateOne({_id:req.params.id},{$set:{
            categoryName : categoryName,
            image : image
          }})
          fs.unlink(`public/images/categoryImages/${category.image}`,(error)=>{
            if(error){
              console.log(error);
            }else{
              console.log(`${category.image} is deleted`);
            }
          });
          res.redirect('/admin/category');
        }else{
          await categorySchema.updateOne({_id:req.params.id},{$set:{
            categoryName:categoryName
          }})
          res.redirect('/admin/category');
        }
      } else {
        req.flash("error", "Category already Exists");
        if (image) {
          fs.unlink(`public/images/categoryImages/${image}`, (error) => {
            if (error) {
              console.log(error);
            } else {
              console.log(`${image} is deleted`);
            }
          });
          res.redirect(`/admin/category/editcategory/${req.params.id}`);
        } else {
          res.redirect(`/admin/category/editcategory/${req.params.id}`);
        }
      }
    } else {
      if (categoryName && image) {
        await categorySchema.updateOne(
          { _id: req.params.id },
          {
            $set: {
              categoryName: categoryName,
              image: image,
            },
          }
        );
        fs.unlink(`public/images/categoryImages/${category.image}`, (error) => {
          if (error) {
            console.log(error);
          } else {
            console.log(`${category.image} is deleted`);
          }
        });
        res.redirect("/admin/category");
      } else if (categoryName) {
        await categorySchema.updateOne(
          { _id: req.params.id },
          {
            $set: {
              categoryName: categoryName,
            },
          }
        );
        res.redirect("/admin/category");
      } else if (image) {
        await categorySchema.updateOne(
          { _id: req.params.id },
          {
            $set: {
              image: image,
            },
          }
        );
        fs.unlink(`public/images/categoryImages/${category.image}`, (error) => {
          if (error) {
            console.log(error);
          } else {
            console.log(`${category.image} is deleted`);
          }
        });
        res.redirect("/admin/category");
      }
    }
  
  } catch (error) {
    console.log(error);
  }
};

module.exports.doDeleteCategory = async (req, res) => {
  try {
    // console.log(req.params);
    if (req.params.id) {
      await categorySchema.updateOne(
        { _id: req.params.id },
        {
          $set: {
            status: false,
          },
        }
      );
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error);
  }
};
