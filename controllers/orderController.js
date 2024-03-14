const cartSchema = require("../models/cartModel");
const productSchema = require("../models/productModel");
const addressSchema = require('../models/addressModel');
const cartHelper = require("../helpers/cartHelper");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");


module.exports.doCartPlaceOrder = async (req,res)=>{
 const {addressId,paymentOption} = req.body
const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
const userId = authUser.userId;
// const order = await cartSchema.aggregate([{$match}])
}