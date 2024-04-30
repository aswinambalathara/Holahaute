const userSchema = require("../models/userModel");
const addressSchema = require("../models/addressModel");
const verficationController = require("../controllers/verificationController");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userHelper = require("../helpers/userHelper");
const { v4: uuidv4 } = require("uuid");
const paymentHelper = require("../helpers/paymentHelper");
const ratingsSchema = require("../models/ratingsModel");
const walletSchema = require("../models/walletmodel");



module.exports.getUserProfile = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const user = await userSchema.findOne({ _id: authUser.userId }).populate({
      path: "addresses",
      model: "addresses",
      match: { status: true },
    });
    const wallet = await walletSchema.findOne({ userId: authUser.userId });
    res.render("user/userProfile.ejs", {
      title: "userProfile",
      userdetail: user,
      user: authUser.userName,
      addresses: user.addresses,
      walletBalance: wallet?.balance,
      wishlistCount : req.session.wishlistCount,
      cartCount : req.session.cartCount
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doSetPrimaryAddress = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const addressId = req.params.id;
    const userId = authUser.userId;
    console.log(addressId, " ", userId);
    
    const address = await addressSchema.findOne({ userId, _id: addressId });
    address.isPrimary = true;
    const update = await address.save()
    console.log(update)
    await addressSchema.updateMany(
      { userId, _id: { $ne: addressId } },
      {
        $set: {
          isPrimary: false,
        },
      }
    );

    if(update){
      res.status(200).json({
        status: true,
        address : update
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getEditUserProfile = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const user = await userSchema.findOne({ _id: authUser.userId });
    res.render("user/editProfile.ejs", {
      title: "Edit Profile",
      userdetail: user,
      user: authUser.userName,
      success: req.flash("success"),
      wishlistCount : req.session.wishlistCount,
      cartCount : req.session.cartCount
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.DoEditUserProfile = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const id = authUser.userId;
    // console.log('entered');
    const { email, phone, fullName, otp } = req.body;
    console.log(req.body);
    const user = await userSchema.findOne({ _id: id });
    if ((email || phone !== "") && otp === "") {
      if (email !== user.email || phone !== user.phone) {
        const emailCheck = await userSchema.find({ email: email });
        console.log(emailCheck);
        if (emailCheck === true && user.email !== email) {
          res.json({
            status: false,
            message: "Email already exist",
          });
        } else {
          const result = userHelper.sendOtp(id, email);
          if (result) {
            res.json({
              status: "OTP send",
              message: `OTP send to ${email}`,
            });
          }
        }
      } else if (fullName && otp === "") {
        const updated = await userSchema.updateOne(
          { _id: id },
          {
            $set: {
              fullName: fullName !== "" ? fullName : undefined,
            },
          }
        );
        if (updated) {
          res.json({
            status: true,
            message: "Updates Successfull",
          });
        }
      }
    } else if (fullName && otp === "") {
      const updated = await userSchema.updateOne(
        { _id: id },
        {
          $set: {
            fullName: fullName !== "" ? fullName : undefined,
          },
        }
      );
      if (updated) {
        res.json({
          status: true,
          message: "Updates Successfull",
        });
      }
    } else if (otp) {
      if (user.token.otp !== otp) {
        res.json({
          status: false,
          message: "Incorrect OTP",
        });
      } else {
        const updated = await userSchema.updateOne(
          { _id: id },
          {
            $set: {
              fullName: fullName !== "" ? fullName : undefined,
              email: email !== "" ? email : undefined,
              phone: phone !== "" ? phone : undefined,
            },
          }
        );
        if (updated) {
          res.json({
            status: true,
            message: "Updates Successfull",
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.DochangeUserPassword = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const user = await userSchema.findOne({ _id: authUser.userId });
    const { password } = user;
    let { oldPassword, newPassword } = req.body;
    const oldPasswordCheck = await bcrypt.compare(oldPassword, password);
    if (oldPasswordCheck !== true) {
      res.json({
        status: false,
        message: "Incorrect Current Password",
      });
    } else {
      newPassword = await bcrypt.hash(newPassword, 12);
      user.password = newPassword;
      const updated = await user.save();
      if (updated) {
        res.json({
          status: true,
          message: "Password Updated Successfully",
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.DochangePasswordWithOtp = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    let { email, newPassword, otp } = req.body;
    console.log(req.body);
    const user = await userSchema.findOne({ _id: authUser.userId });
    const { password } = user;
    if (email !== undefined) {
      const updated = await userHelper.sendOtp(authUser.userId, email);
      if (updated) {
        res.json({
          status: true,
          message: `An otp send to ${email}`,
        });
      }
    } else if (otp && newPassword) {
      if (user.token?.otp !== otp) {
        res.json({
          status: false,
          message: "Incorrect OTP",
        });
      } else {
        const passwordCheck = await bcrypt.compare(newPassword, password);
        if (passwordCheck === true) {
          res.json({
            status: false,
            message: "Cannot set current password as new password",
          });
        } else {
          newPassword = await bcrypt.hash(newPassword, 12);
          user.password = newPassword;
          const updated = await user.save();
          if (updated) {
            res.json({
              status: true,
              message: "Password updated succefully",
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getAddAddress = (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    res.render("user/addAddress.ejs", {
      title: "Add Address",
      user: authUser.userName,
      wishlistCount : req.session.wishlistCount,
      cartCount : req.session.cartCount
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doAddAddress = async (req, res) => {
  try {
    //  console.log(req.body);
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const addresses = await addressSchema.find({userId:authUser.userId});
    const{fullName,mobile,address,district,state,pincode,fromCheckout} = req.body
    if (authUser.userId) {
      const isPrimary = addresses.length === 0? true : undefined
      const newAddress = new addressSchema({
        fullName: fullName,
        mobile: Number(mobile),
        address: address,
        district: district,
        state: state,
        pincode: Number(pincode),
        userId: authUser.userId,
        isPrimary : isPrimary
      });
      const result = await newAddress.save();
      await userSchema.updateOne(
        { _id: authUser.userId },
        { $push: { addresses: result._id } }
      );
      if(fromCheckout && result){
       return res.json({
          status : true,
          address : result
        })
      }
      res.redirect("/user/userprofile");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doUnlistAddress = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const addressId = req.params.id;
    const userId = authUser.userId;
    console.log(addressId, "  ", userId);
    if (addressId && userId) {
      await addressSchema.updateOne(
        { _id: addressId, userId },
        {
          $set: {
            status: false,
          },
        }
      );
      res.status(200).json({
        status: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getEditAddress = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    //console.log(req.params.id);
    const address = await addressSchema.findOne({ _id: req.params.id });
    res.render("user/editAddress.ejs", {
      title: "Edit Address",
      user: authUser.userName,
      address: address,
      wishlistCount : req.session.wishlistCount,
      cartCount : req.session.cartCount
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doEditAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const { fullName, mobile, address, district, state, pincode } = req.body;
    await addressSchema.updateOne(
      { _id: addressId },
      {
        $set: {
          fullName: fullName !== "" ? fullName : undefined,
          mobile: mobile !== "" ? mobile : undefined,
          address: address !== "" ? address : undefined,
          district: district !== "" ? district : undefined,
          state: state !== "" ? state : undefined,
          pincode: pincode !== "" ? pincode : undefined,
        },
      }
    );
    req.flash("success", "Address Update SuccessFull");
    res.redirect("/user/userprofile");
  } catch (error) {
    console.log(error);
  }
};

module.exports.doProductRating = async (req, res) => {
  try {
    const { productId, rating, review } = req.body;
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const { userId } = authUser;
    const existRating = await ratingsSchema.findOne({
      userId: userId,
      productId: productId,
    });
    if (existRating) {
      return res.json({
        status: false,
        message: "Review Already Exist",
      });
    }
    const newRating = new ratingsSchema({
      userId: userId,
      productId: productId,
      rating: Number(rating),
      review: review ? review : undefined,
    });
    const inserted = await newRating.save();
    if (inserted) {
      res.json({
        status: true,
        message: "Thanks for rating",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doAddWalletMoney = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    //console.log(req.body);
    const { amount } = req.body;
    const paymentId = uuidv4();
    const payment = await paymentHelper.createPayment(paymentId, amount);
    if (payment) {
      res.json({
        status: true,
        payment: payment,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doVerifyWalletPayment = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const { userId } = authUser;
    let { response, paymentData } = req.body;
    console.log(response);
    const verify = await paymentHelper.verifyPayment(response);
    if (verify.status === true) {
      paymentData.amount = paymentData.amount / 100;
      const walletExist = await walletSchema.findOne({ userId: userId });
      if (walletExist) {
        const history = {
          paymentType: "Deposit",
          paymentId: verify.paymentId,
          amount: paymentData.amount,
          currentBalance: walletExist.balance + paymentData.amount,
        };
        const updateWallet = await walletSchema.updateOne(
          { userId: userId },
          { $inc: { balance: paymentData.amount }, $push: { history: history } }
        );
        if (updateWallet) {
          return res.json({
            paid: true,
            message: `${paymentData.amount} added to wallet`,
          });
        }
      } else {
        const newWallet = new walletSchema({
          userId: userId,
          balance: paymentData.amount,
          history: [
            {
              paymentType: "Deposit",
              paymentId: verify.paymentId,
              amount: paymentData.amount,
              currentBalance: paymentData.amount,
            },
          ],
        });
        const createWallet = await newWallet.save()
        if (createWallet) {
          return res.json({
            paid: true,
            message: `₹ ${paymentData.amount} added to wallet`,
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getWalletHistory = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const { userId } = authUser;
    const wallet = await walletSchema.findOne({userId:userId});
    if(wallet){
      return res.json({
        status : true,
        walletBalance : wallet.balance,
        walletHistory : wallet.history
      })
    }
  } catch (error) {
    console.log(error)
  }
};

module.exports.generateReferralCode = async (req,res)=>{
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const { userId } = authUser;
    const referralCode = userHelper.generateReferralCode()
    if(referralCode){
      const update = await userSchema.updateOne({_id:userId},{$set:{
        referralCode : referralCode.toString()
      }});
      if(update){
        return res.json({
          status : true,
          referralCode : referralCode
        });
      }
    }
  } catch (error) {
    console.error(error)
  }
}