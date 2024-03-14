const jwt = require("jsonwebtoken");

module.exports.isUserAuth = (req, res, next) => {
  if (!req.session.userAuthId) {
    res.redirect("/login");
  } else {
    next();
  }
};

module.exports.isUserLoggedOut = (req, res, next) => {
  //console.log(req.session.userAuth);
  if (req.cookies.token) {
    res.redirect("/home");
  } else {
    next();
  }
};

module.exports.isAdminAuth = (req, res, next) => {
  if (!req.session.adminAuth) {
    res.redirect("/admin/login");
  } else {
    next();
  }
};

module.exports.isAdminLoggedOut = (req, res, next) => {
  if(req.cookies.token){
    res.redirect('/home')
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
