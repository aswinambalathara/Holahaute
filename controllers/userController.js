const userSchema = require("../models/userModel");
const addressSchema = require("../models/addressModel");
const verficationController = require("../controllers/verificationController");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')
module.exports.getUserProfile = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    const user = await userSchema
      .findOne({ _id: authUser.userId })
      .populate({
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
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
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
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
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

module.exports.getOldEditProfile = async (req,res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    //const user = await userSchema.findOne({ _id: authUser.userId });
    res.render("user/editProfileOld.ejs", {
      title: "Edit Profile",
      user : "None"
    });
  } catch (error) {
    console.log(error)
  }
}

module.exports.DoEditUserProfile = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    const id = authUser.userId;
    console.log('entered');
    const {fullName} = req.body
    const {email,phone,otp} = req.body
    const user = await userSchema.findOne({ _id: id });
    if(fullName){
      user.fullName = fullName !== ''? fullName : undefined;
      const updated = await user.save()
      if(updated){
        res.json({
          status : true,
          message : "Updates Successfull"
        })
       }else{
        res.json({
          status : false,
          message : "Something went wrong"
        })
       }
    }else if (fullName || email || phone && otp) {
      if (otp === user.token.otp) {
        user.fullName = fullName !== ''? fullName : undefined;
        user.email = email !== " "? email : undefined;
        user.phone = phone !== " "? phone : undefined;
        const updated = await user.save();
        if(updated){
          res.json({
            status : true,
            message : "Updates Successfull"
          })
         }else{
          res.json({
            status : false,
            message : "Something went wrong"
          })
         }
      }else{
        res.json({
          status : false,
          message : "Incorrect OTP"
        });
      }
    } else{
      res.json({
        status : "nochange"
      })
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.DochangeUserPassword =  async (req,res) =>{

};


module.exports.sendOtp = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    const id = authUser.userId;
    const { email } = req.body;
    const user = await userSchema.findOne({ _id: id });
    if(email){
      const otp = verficationController.sendEmail(email);
      if(otp){
        user.token.otp = otp;
        user.token.generatedTime = Date.now()
       const updated = await user.save()
       if(updated){
        res.json({
          status : true,
          message : `OTP send to ${email}`
        })
       }else{
        res.json({
          status : false,
          message : "Something went wrong"
        })
       }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getAddAddress = (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
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
  const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
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
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
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
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    //console.log(req.params.id);
    const address = await addressSchema.findOne({_id:req.params.id});
    res.render("user/editAddress.ejs", {
      title: "Edit Address",
      user: authUser.userName,
      address : address
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doEditAddress = async (req, res)=>{
  try {
    const addressId = req.params.id
    const {fullName,mobile,address,district,state,pincode} = req.body
     await addressSchema.updateOne({_id:addressId},{$set:{
      fullName : fullName !== ''? fullName : undefined,
      mobile : mobile !== ''? mobile : undefined,
      address : address !== ''? address : undefined,
      district : district !== ''? district : undefined,
      state : state !== ''? state : undefined,
      pincode : pincode !== ''? pincode : undefined,
     }});
     req.flash('success',"Address Update SuccessFull");
     res.redirect('/user/userprofile')
  } catch (error) {
    console.log(error)
  }
}