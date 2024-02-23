const userSchema = require('../models/userModel');

module.exports.getUserProfile = (req,res)=>{
    try {
        res.render('user/userProfile.ejs',{
            title: "userProfile",
             user: req.session.userAuth
        });
    } catch (error) {
        console.log(error)
    }
}

module.exports.getEditUserProfile = (req,res)=>{
    try {
        res.render('user/editProfile.ejs',{
            title: "Edit Profile",
             user: req.session.userAuth
        });
    } catch (error) {
        console.log(error)
    }
}