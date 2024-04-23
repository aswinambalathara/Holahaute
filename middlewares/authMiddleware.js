const jwt = require("jsonwebtoken");
const userSchema = require('../models/userModel');

module.exports.isUserLoggedOut = (req, res, next) => {
  //console.log(req.session.userAuth);
  if (req.cookies.token) {
    res.redirect("/home");
  } else {
    next();
  }
};

// module.exports.isAdminAuth = (req, res, next) => {
//   if (!req.session.adminAuth) {
//     res.redirect("/admin/login");
//   } else {
//     next();
//   }
// };

module.exports.isAdminLoggedOut = (req, res, next) => {
  const token = req.cookies.adminToken;
  console.log(token)
  if(req.cookies.adminToken){
    res.redirect('/admin')
  }else{
    next()
  }
};

module.exports.isnewUser = (req, res, next) => {
  if (!req.session.unVerifiedEmail) {
    res.redirect("/signup");
  }
  next();
};

module.exports.forgotuser = (req, res, next) => {
  if (!req.session.userWithOtp) {  
    res.redirect("/forgotpassword");
  }
  next();
};

module.exports.userStatus = (req, res, next) => {
  
  // if(req.session.userIsBlocked === undefined){
  //   const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
  // }
  if (!req.session.userIsBlocked) { 
    next();
  } else {
    res.clearCookie('token')
    res.redirect("/home");
  }
};

module.exports.verifyUser = (req, res, next) => {
  try {
      const token = req.cookies.token;
      const user = jwt.verify(token, process.env.JWT_SECRET,(err)=>{
        if(err){
          res.redirect('/login')
        }else{
          next()
        }
      }); 

  } catch (error) {
    console.log(error);
    //res.redirect('/home');
  }
};

module.exports.verifyAdmin = (req,res,next)=>{
  try {
    //console.log('hi')
    const token = req.cookies.adminToken;
    jwt.verify(token, process.env.JWT_SECRET,(err)=>{
      if(err){
        res.redirect('/admin/login')
      }else{
        next()
      }
    });
  } catch (error) {
    console.log(error)
  }
}
