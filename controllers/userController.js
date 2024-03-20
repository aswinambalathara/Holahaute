const userSchema = require("../models/userModel");
const addressSchema = require("../models/addressModel");
const verficationController = require("../controllers/verificationController");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userHelper = require("../helpers/userHelper");
const { use } = require("passport");

module.exports.getUserProfile = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const user = await userSchema.findOne({ _id: authUser.userId }).populate({
      path: "addresses",
      model: "addresses",
      match: { status: true },
    });
    res.render("user/userProfile.ejs", {
      title: "userProfile",
      userdetail: user,
      user: authUser.userName,
      addresses: user.addresses,
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
    await addressSchema.updateOne(
      { userId, _id: addressId },
      {
        $set: {
          isPrimary: true,
        },
      }
    );

    await addressSchema.updateMany(
      { userId, _id: { $ne: addressId } },
      {
        $set: {
          isPrimary: false,
        },
      }
    );
    res.status(200).json({
      status: "success",
    });
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
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getOldEditProfile = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    //const user = await userSchema.findOne({ _id: authUser.userId });
    res.render("user/editProfileOld.ejs", {
      title: "Edit Profile",
      user: "None",
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
const user = await userSchema.findOne({_id : authUser.userId});
const {password} = user
let {oldPassword,newPassword} = req.body;
const oldPasswordCheck = await bcrypt.compare(oldPassword,password);
if(oldPasswordCheck !== true){
  res.json({
    status : false,
    message : "Incorrect Current Password"
  })
}else{
 newPassword = await bcrypt.hash(newPassword,12);
 user.password = newPassword;
 const updated = await user.save()
 if(updated){
  res.json({
    status : true,
    message : "Password Updated Successfully"
  })
 }
}
} catch (error) {
  console.log(error)
}
};

module.exports.DochangePasswordWithOtp = async (req,res) =>{

}

module.exports.getAddAddress = (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    res.render("user/addAddress.ejs", {
      title: "Add Address",
      user: authUser.userName,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doAddAddress = async (req, res) => {
  try {
    //  console.log(req.body);
    const authUser = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    if (authUser.userId) {
      const address = new addressSchema({
        fullName: req.body.fullName,
        mobile: req.body.mobile,
        address: req.body.address,
        district: req.body.district,
        state: req.body.state,
        pincode: req.body.pincode,
        userId: authUser.userId,
      });
      const result = await address.save();
      await userSchema.updateOne(
        { _id: authUser.userId },
        { $push: { addresses: result._id } }
      );
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
        status: "success",
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
