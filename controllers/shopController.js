const categorySchema = require("../models/categoryModel");
const productSchema = require("../models/productModel");
const jwt = require('jsonwebtoken')
module.exports.getHomePage = async (req, res) => {
  try {
    let user
    if(req.cookies.token){
       user = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    }
    const products = await productSchema.find({isDeleted:false});
    const categories = await categorySchema.find({status:true});
    res.render("shop/home", {
      title: "Home",
      categories,
      products,
      user: user? user.userName : undefined
    });
  } catch (error) {
    console.log(error)
  }
};

module.exports.getProductDetailPage = async (req, res) => {
    try {
      const user = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
        const product = await productSchema.findOne({_id:req.params.id});
        const products = await productSchema.find({isDeleted:false,_id:{$ne:req.params.id}});
        res.render("shop/productDetail", {
            title: product.productName,
            product,
            products,
            user: user.userName
          });
    } catch (error) {
        console.log(error)
    }
  
};

module.exports.getProductsPage = async (req, res) => {
    try {
      const user = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
       const products = await productSchema.find({isDeleted:false})
        res.render("shop/allProducts", {
            title: "All Products",
            products,
            user: user.userName
          }); 
    } catch (error) {
        console.log(error)
    }
  
};

module.exports.doSearch = async (req,res)=>{
 try {
  const {searchTerm} = req.body
  const suggestions = await productSchema.find({isDeleted:false,$or :[
    {productName : {$regex : searchTerm, $options : 'i'}},
    {description : {$regex : searchTerm, $options : 'i'}}
  ]})
  res.json({
    suggestions : suggestions,
    success : true
  })
 } catch (error) {
  console.log(error)
 }
 
}