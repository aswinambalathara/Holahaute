const bcrypt = require("bcrypt");
const userSchema = require("../models/userModel");
const adminSchema = require("../models/adminModel");
const verificationController = require("../controllers/verificationController");
const wishlistSchema = require('../models/wishlistModel');
const cartSchema = require('../models/cartModel');
const jwt = require('jsonwebtoken');

module.exports.getUserSignup = (req, res) => {
  const locals = {
    title: "SignUP",
  };
  res.render("auth/signUp", { locals, err: req.flash("error") });
};

module.exports.doUserSignup = async (req, res) => {
  try {
    // console.log(req.body);
    const userData = await userSchema.findOne({ email: req.body.email });
    if (userData) {
      req.flash("error", "User already exist");
      return res.redirect("/signup");
    } else {
      const otp = verificationController.sendEmail(req.body.email);
      const password = await bcrypt.hash(req.body.password, 10);
      const user = {
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        password: password,
        token: {
          otp: otp,
          generatedTime: Date.now(),
        },
        isVerified: false,
      };
      req.session.unVerifiedUser = user;
      req.session.unVerifiedEmail = user.email;
      res.redirect("/otpverification");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getSignupverification = (req, res) => {
  const locals = {
    title: "User Verification",
    email: req.session.unVerifiedEmail,
  };
  res.render("auth/otpverify", { locals, err: req.flash("error") });
};

module.exports.doSignupverification = async (req, res) => {
  try {
    const enterTime = Date.now();
    const { otp } = req.body;
    const timeDiff =
      (enterTime - req.session.unVerifiedUser.token.generatedTime) / 1000;
    console.log(timeDiff);
    if (otp === req.session.unVerifiedUser.token.otp) {
      if (timeDiff < 30) {
        req.session.unVerifiedUser.isVerified = true;
        const verifedUser = new userSchema(req.session.unVerifiedUser);
        await verifedUser.save().then(() => {
          req.session.unVerifiedEmail = null;
          req.session.unVerifiedUser = null;
          res.redirect("/login");
        });
      } else {
        req.flash("error", "Time Out Please enter the new OTP received");
        const otp = verificationController.sendEmail(
          req.session.unVerifiedEmail
        );
        req.session.unVerifiedUser.token.otp = otp;
        req.session.unVerifiedUser.token.generatedTime = Date.now();
        res.redirect("/otpverification");
      }
    } else {
      req.flash("error", "Incorrect OTP");
      const otp = verificationController.sendEmail(req.session.unVerifiedEmail);
      req.session.unVerifiedUser.token.otp = otp;
      req.session.unVerifiedUser.token.generatedTime = Date.now();
      res.redirect("/otpverification");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doResendOTP = (req, res) => {
  try {
    const enterTime = Date.now();
    const email = req.session.unVerifiedEmail;
    const { action } = req.body;
    const timeDiff =
      (enterTime - req.session.unVerifiedUser.token.generatedTime) / 1000;
    if (email) {
      if (action === "resend") {
        if (timeDiff > 30) {
          const otp = verificationController.sendEmail(email);
          req.session.unVerifiedUser.token.otp = otp;
          req.session.unVerifiedUser.token.generatedTime = Date.now();
          if (otp) {
            res.status(200).json({
              message: `OTP send to ${email}`,
            });
          } else {
            res.json({
              message: "something went wrong Try again",
            });
          }
        } else {
          res.json({
            status : "otpsend",
            message: `You can resend OTP after ${Math.floor(
              30 - timeDiff
            )} Seconds `,
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// LOGIN SECTION
module.exports.getUserLogin = (req, res) => {
  const locals = {
    title: "Login",
  };
  res.render("auth/userLogin", {
    locals,
    err: req.flash("error"),
  });
  // console.log(process.env.GOOGLE_CLIENT_ID)
};

module.exports.doUserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await userSchema.findOne({ email });
    if (userData) {
      if (userData.isBlocked === false) {
        req.session.userIsBlocked = false;
        const checkPassword = await bcrypt.compare(password, userData.password);
        if (checkPassword) {
          const wishlist = await wishlistSchema.findOne({userId : userData._id})
          const cart = await cartSchema.findOne({userId : userData._id});
          req.session.cartCount = cart? cart.cartItems.length : 0
          req.session.wishlistCount = wishlist?  wishlist.wishlistItems.length : 0
          const payLoad = {
            userName : userData.fullName,
            userId : userData._id
          }

        const token = jwt.sign(payLoad,process.env.JWT_SECRET,{expiresIn : '24h'})  
          res.cookie('token',token,{httpOnly:true,secure : true});
          
          res.redirect("/home");
        } else {
          req.flash("error", "Incorrect Password");
          res.redirect("/login");
        }
      } else {
        req.flash("error", "User Blocked");
        res.redirect("/login");
      }
    } else {
      req.flash("error", "User Not Found");
      res.redirect("/login");
    }
  
  } catch (error) {
    console.log(error);
  }
};

//LOGIN WITH OTP SECTION
module.exports.getOtpLogin = (req, res) => {
  const locals = { title: "OTP Login" };
  res.render("auth/signInOTP", {
    locals,
    err: req.flash("error"),
  });
};

module.exports.sendOtpLogin = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userSchema.findOne({ email });
    if (user) {
      req.session.userwithotp = email;
      const otp = verificationController.sendEmail(email);
      if (otp) {
        await userSchema.updateOne(
          { email },
          {
            $set: {
              "token.otp": otp,
              "token.generatedTime": Date.now(),
            },
          }
        );
        res.json({
          message: `OTP send to ${email}`,
          status: "success",
        });
      }
    } else {
      res.json({
        message: "User not Found",
        status: "failed",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doOtpLogin = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await userSchema.findOne({
      email: req.session.userwithotp,
      "token.otp": otp,
    });
    if (user) {
      if (!user.isBlocked) {
        if(user.isVerified){
          const wishlist = await wishlistSchema.findOne({userId : user._id})
          const cart = await cartSchema.findOne({userId : user._id});
          req.session.cartCount = cart? cart.cartItems.length : 0
          req.session.wishlistCount = wishlist?  wishlist.wishlistItems.length : 0
          const payLoad = {
            userName : user.fullName,
            userId : user._id
          }
        const token = jwt.sign(payLoad,process.env.JWT_SECRET,{expiresIn : '1h'})
          res.cookie('token',token,{httpOnly:true,secure : true});
        res.redirect("/home");
        }else{
          req.flash('error',"user not verified");
          res.redirect('/otpverification')
        }
      } else {
        req.flash("error", "Blocked User");
        res.status(401).redirect("/otplogin");
      }
    } else {
      req.flash("error", "Incorrect OTP");
      res.status(401).redirect("/otplogin");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getAdminLogin = (req, res) => {
  res.render("auth/adminLogin", {
    title: "Admin Login",
    err: req.flash("error"),
  });
};

module.exports.doAdminLogin = async (req, res) => {
  try {
    const adminData = await adminSchema.findOne({ email: req.body.email });
    if (!adminData) {
      req.flash("error", "Admin not found");
      res.redirect("/admin/login");
    } else {
      const password = await bcrypt.compare(
        req.body.password,
        adminData.password
      );
      if (!password) {
        req.flash("error", "Invalid Credentials");
        res.redirect("/admin/login");
      } else {
        const token = jwt.sign({adminId : adminData._id},process.env.JWT_SECRET,{expiresIn : '24hr'});
        res.cookie('adminToken',token,{httpOnly : true, secure : true})
        res.redirect("/admin");
      }
    }
  } catch (error) {
    console.log("error");
  }
};

module.exports.getForgotPassword = (req, res) => {
  const locals = {
    title: "Forgot Password",
  };
  res.render("auth/forgotPassword", { locals, err: req.flash("error") });
};

module.exports.doForgotPassword = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.session.userwithotp;
    if (otp) {
      const otpCheck = await userSchema.findOne({ email, "token.otp": otp });
      if (!otpCheck) {
        req.flash("error", "Invalid OTP");
        res.redirect("/forgotpassword");
      } else {
        res.redirect("/changepassword");
      }
    } else {
      req.flash("error", "No OTP found");
      res.redirect("/forgotpassword");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.sendForgotOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userSchema.findOne({ email });
    if (!user) {
      res.status(404).json({
        status: "notfound",
        message: "User not found",
      });
    } else {
      if (!user.isBlocked) {
        const sendOtp = verificationController.sendEmail(email);
        req.session.userwithotp = email;
        await userSchema.updateOne(
          { email },
          {
            $set: {
              "token.otp": sendOtp,
              "token.generatedTime": Date.now(),
            },
          }
        );

        if (sendOtp) {
          res.json({
            status: "success",
            message: `OTP send to ${user.email}`,
          });
        } else {
          res.json({
            status: "failed",
            message: "Something Went Wrong",
          });
        }
      } else {
        res.json({
          status: "failed",
          message: "User Blocked",
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getChangePassword = (req, res) => {
  const locals = {
    title: "Change Password",
  };
  res.render("auth/changepassword", { locals, err: req.flash("error") });
};

module.exports.doChangePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.session.userwithotp;
    console.log(password, email);
    if (password && email) {
      const user = await userSchema.findOne({ email });
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        const hashPassword = await bcrypt.hash(password, 10);
        await userSchema.updateOne(
          { email },
          {
            $set: {
              password: hashPassword,
            },
          }
        );
        res.redirect("/login");
      } else {
        req.flash("error", "Can't Set Old Password as New Password");
        res.redirect("/changepassword");
      }
    } else {
      req.flash("error", "NO email or password found");
      res.redirect("/changepassword");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.userLogOut = (req,res)=>{
  try {
    res.clearCookie('token')
    res.redirect('/home');
  } catch (error) {
    console.log(error);
  }
}

module.exports.adminLogOut = (req,res)=>{
  try {
    res.clearCookie('adminToken')
    //req.session.adminAuth = null;
    res.redirect('/admin/login');
  } catch (error) {
    console.log(error)
  }
}