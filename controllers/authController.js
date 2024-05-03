const bcrypt = require('bcrypt');
const userSchema = require("../models/userModel");
const adminSchema = require("../models/adminModel");
const verificationController = require("../controllers/verificationController");
const wishlistSchema = require("../models/wishlistModel");
const cartSchema = require("../models/cartModel");
const walletSchema = require("../models/walletmodel");
const jwt = require("jsonwebtoken");
const authHelper = require("../helpers/authHelper");
const { response, json } = require("express");

module.exports.getUserSignup = (req, res,next) => {
  try {
    const locals = {
      title: "SignUP",
    };
    res.render("auth/signUp", { locals, err: req.flash("error") });
  } catch (error) {
    console.error(error)
    next(error)
  }
  
};

module.exports.doUserSignup = async (req, res,next) => {
  try {
    // console.log(req.body);
    const { email, password, fullName, phone, referralCode } = req.body;
    const userData = await userSchema.findOne({ email: email });
    if (userData) {
      req.flash("error", "User already exist");
      return res.redirect("/signup");
    } else {
      const referralCheck = await userSchema.findOne({
        referralCode: referralCode,
      });
      if (referralCheck) {
        req.session.referredUser = referralCheck._id;
      }
      const otp = verificationController.sendEmail(email);
      const hashPassword = await bcrypt.hash(password, 10);
      const user = {
        fullName: fullName,
        email: email,
        phone: phone,
        password: hashPassword,
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
    console.error(error);
    next(error)
  }
};

module.exports.getSignupverification = (req, res,next) => {
  try {
    const locals = {
      title: "User Verification",
      email: req.session.unVerifiedEmail,
    };
    res.render("auth/otpverify", { locals, err: req.flash("error") });
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.doSignupverification = async (req, res,next) => {
  try {
    const enterTime = Date.now();
    const { otp } = req.body;
    const timeDiff =
      (enterTime - req.session.unVerifiedUser.token.generatedTime) / 1000;
    console.log(timeDiff);
    if (otp === req.session.unVerifiedUser.token.otp) {
      if (timeDiff < 30) {
        req.session.unVerifiedUser.isVerified = true;
        const referedUser = req.session.referredUser? req.session.referredUser : undefined;
        const verifedUser = new userSchema(req.session.unVerifiedUser);
        const newUser = await verifedUser.save();
        if (newUser) {
          if(referedUser !== undefined){
            const userId = newUser._id;
            const newWallet = new walletSchema({
              userId: userId,
              balance: 100,
              history: [
                {
                  paymentType: "Deposit",
                  paymentId: "Refferal",
                  amount: 100,
                  currentBalance: 100,
                },
              ],
            });
  
            await newWallet.save();
            const wallet = await walletSchema.findOne({ userId: referedUser });
            if (!wallet) {
              const newWallet = new walletSchema({
                userId: referedUser,
                balance: 100,
                history: [
                  {
                    paymentType: "Deposit",
                    paymentId: "Refferal",
                    amount: 100,
                    currentBalance: 100,
                  },
                ],
              });
              await newWallet.save();
            } else {
              const history = {
                paymentType: "Deposit",
                paymentId: "Referral",
                amount: 100,
                currentBalance: wallet.balance + 100,
              };
              const updateWallet = await walletSchema.updateOne(
                { userId: referedUser },
                {
                  $inc: { balance: 100 },
                  $push: { history: history },
                }
              );
            }
          }
          req.session.referredUser = null;
          req.session.unVerifiedEmail = null;
          req.session.unVerifiedUser = null;
          return res.redirect("/login");
        }
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
    console.error(error);
    next(error)
  }
};

module.exports.doResendOTP = (req, res,next) => {
  try {
    const enterTime = Date.now();
    const email = req.session.unVerifiedEmail;
    const { action } = req.body;
    console.log(enterTime, " ", req.session.unVerifiedUser.token.generatedTime);
    const timeDiff = (enterTime - req.session.unVerifiedUser.token.generatedTime) / 1000;
    if (email) {
      if (action) {
        if (timeDiff > 30) {
          const otp = verificationController.sendEmail(email);
          req.session.unVerifiedUser.token.otp = otp;
          req.session.unVerifiedUser.token.generatedTime = Date.now();
          if (otp) {
            res.status(200).json({
             status: true,
              message: `OTP send to ${email}`,
            });
          } else {
            res.json({
              status: false,
              message: "something went wrong Try again",
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
    next(error)
  }
};

// LOGIN SECTION
module.exports.getUserLogin = (req, res,next) => {
  try {
    const locals = {
      title: "Login",
    };
    res.render("auth/userLogin", {
      locals,
      err: req.flash("error"),
    });
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.doUserLogin = async (req, res,next) => {
  try {
    const { email, password } = req.body;
    console.log(req.body)
    const userData = await userSchema.findOne({ email : email}); 
    console.log(userData)
    if (userData) {
      if (userData.isBlocked === false) {
        req.session.userIsBlocked = false;
        const checkPassword = await bcrypt.compare(password, userData.password);
        if (checkPassword) {
          const wishlist = await wishlistSchema.findOne({
            userId: userData._id,
          });
          const cart = await cartSchema.findOne({ userId: userData._id });
          req.session.cartCount = cart ? cart.cartItems.length : 0;
          req.session.wishlistCount = wishlist
            ? wishlist.wishlistItems.length
            : 0;
          const payLoad = {
            userName: userData.fullName,
            userId: userData._id,
          };
          const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
            expiresIn: "24h",
          });
          res.cookie("token", token, { httpOnly: true, secure: true });
          res.redirect("/home");
        } else {
          req.flash("error", "Incorrect Password");
          res.redirect("/login");
        }
      } else {
        req.flash("error", "You have been blocked");
        res.redirect("/login");
      }
    } else {
      req.flash("error", "User Not Found");
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error)
    next(error)
  }
};

//LOGIN WITH OTP SECTION
module.exports.getOtpLogin = (req, res,next) => {
  try {
    const locals = { title: "OTP Login" };
  res.render("auth/signInOTP", {
    locals,
    err: req.flash("error"),
  });
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.sendOtpLogin = async (req, res,next) => {
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
    console.error(error)
    next(error)
  }
};

module.exports.doOtpLogin = async (req, res,next) => {
  try {
    const { otp } = req.body;
    const user = await userSchema.findOne({
      email: req.session.userwithotp,
      "token.otp": otp,
    });
    if (user) {
      if (!user.isBlocked) {
        if (user.isVerified) {
          const wishlist = await wishlistSchema.findOne({ userId: user._id });
          const cart = await cartSchema.findOne({ userId: user._id });
          req.session.cartCount = cart ? cart.cartItems.length : 0;
          req.session.wishlistCount = wishlist
            ? wishlist.wishlistItems.length
            : 0;
          const payLoad = {
            userName: user.fullName,
            userId: user._id,
          };
          const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
            expiresIn: "24h",
          });
          res.cookie("token", token, { httpOnly: true, secure: true });
          res.redirect("/home");
        } else {
          req.flash("error", "user not verified");
          res.redirect("/otpverification");
        }
      } else {
        req.flash("error", "You have been blocked");
        res.status(401).redirect("/otplogin");
      }
    } else {
      req.flash("error", "Incorrect OTP");
      res.status(401).redirect("/otplogin");
    }
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.doGoogleLogin = async (req, res,next) => {
  try {
    //console.log(req.body);
    const { googleResponse } = req.body;
    const token = googleResponse.credential;
    const googlePayload = await authHelper.verifyGoogleToken(token);
    //console.log(googlePayload);
    const { name, sub, email, email_verified, picture } = googlePayload;
    const user = await userSchema.findOne({ googleId: sub });
    if (user) {
      //if user exist
      if (user.isBlocked) {
        return res.json({
          status: false,
          blockStatus: true,
          message: "You have been blocked",
        });
      }
      const payLoad = {
        userId: user._id,
        userName: user.fullName,
      };
      const wishlist = await wishlistSchema.findOne({ userId: user._id });
      const cart = await cartSchema.findOne({ userId: user._id });
      req.session.cartCount = cart ? cart.cartItems.length : 0;
      req.session.wishlistCount = wishlist ? wishlist.wishlistItems.length : 0;

      const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      res.cookie("token", token, { httpOnly: true, secure: true });
      return res.json({
        status: true,
        message: "User verified",
      });
    } else {
      //if user doesn't exist
      const existUser = await userSchema.findOne({ email: email });
      if (existUser) {
        return res.json({
          status: false,
          message: `Account exist with this email! \n Try Sign in or reset password`,
        });
      }
      const newGoogleUser = new userSchema({
        fullName: name,
        googleId: sub,
        email: email,
        isVerified: email_verified,
        image: picture,
      });
      const saveUser = await newGoogleUser.save();
      if (saveUser) {
        const payLoad = {
          userId: saveUser._id,
          userName: saveUser.fullName,
        };
        const wishlist = await wishlistSchema.findOne({ userId: saveUser._id });
        const cart = await cartSchema.findOne({ userId: saveUser._id });
        req.session.cartCount = cart ? cart.cartItems.length : 0;
        req.session.wishlistCount = wishlist
          ? wishlist.wishlistItems.length
          : 0;

        const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
          expiresIn: "24h",
        });

        res.cookie("token", token, { httpOnly: true, secure: true });
        return res.json({
          status: true,
          message: "User verified",
        });
      }
    }
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.getAdminLogin = (req, res,next) => {
  try {
    res.render("auth/adminLogin", {
      title: "Admin Login",
      err: req.flash("error"),
    });
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.doAdminLogin = async (req, res,next) => {
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
        const token = jwt.sign(
          { adminId: adminData._id },
          process.env.JWT_SECRET,
          { expiresIn: "24hr" }
        );
        res.cookie("adminToken", token, { httpOnly: true, secure: true });
        res.redirect("/admin");
      }
    }
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.getForgotPassword = (req, res,next) => {
  try {
    const locals = {
      title: "Forgot Password",
    };
    res.render("auth/forgotPassword", { locals, err: req.flash("error") });
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.doForgotPassword = async (req, res,next) => {
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
    console.error(error)
    next(error)
  }
};

module.exports.sendForgotOtp = async (req, res,next) => {
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
    console.error(error)
    next(error)
  }
};

module.exports.getChangePassword = (req, res,next) => {
  try {
    const locals = {
      title: "Change Password",
    };
    res.render("auth/changepassword", { locals, err: req.flash("error") });
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.doChangePassword = async (req, res,next) => {
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
    console.error(error)
    next(error)
  }
};

module.exports.userLogOut = (req, res,next) => {
  try {
    res.clearCookie("token");
    res.redirect("/home");
  } catch (error) {
    console.error(error)
    next(error)
  }
};

module.exports.adminLogOut = (req, res,next) => {
  try {
    res.clearCookie("adminToken");
    //req.session.adminAuth = null;
    res.redirect("/admin/login");
  } catch (error) {
    console.error(error)
    next(error)
  }
};
