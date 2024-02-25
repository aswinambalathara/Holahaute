const userSchema = require('../models/userModel');
const addressSchema = require('../models/addressModel');
module.exports.getUserProfile = async (req,res)=>{
    try {
      const user = await userSchema.findOne({_id:req.session.userAuthId})
        res.render('user/userProfile.ejs',{
            title: "userProfile",
             userdetail: user,
             user: req.session.userAuth
        });
    } catch (error) {
        console.log(error)
    }
}

module.exports.getEditUserProfile = async  (req,res)=>{
    try {
        const user = await userSchema.findOne({_id:req.session.userAuthId});
        res.render('user/editProfile.ejs',{
            title: "Edit Profile",
             userdetail: user,
             user:req.session.userAuth
        });
    } catch (error) {
        console.log(error)
    }
}

module.exports.getAddAddress = (req,res)=>{
    try {
        res.render('user/addAddress.ejs',{
            title: "Add Address",
             user: req.session.userAuth
        });
    } catch (error) {
        console.log(error)
    }
}

module.exports.doAddAddress = (req,res)=>{
    try {
        console.log(req.body);
    } catch (error) {
        console.log(error)
    }
}

module.exports.getEditAddress = (req,res)=>{
    try {
        res.render('user/editAddress.ejs',{
            title: "Edit Address",
             user: req.session.userAuth
        });
    } catch (error) {
        console.log(error)
    }
}