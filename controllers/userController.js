const userSchema = require("../models/userModel");
const addressSchema = require("../models/addressModel");
module.exports.getUserProfile = async (req, res) => {
  try {
    const user = await userSchema
      .findOne({ _id: req.session.userAuthId })
      .populate({
        path: "addresses",
        model: "addresses",
        match: { status: true },
      });
    res.render("user/userProfile.ejs", {
      title: "userProfile",
      userdetail: user,
      user: req.session.userAuth,
      addresses: user.addresses,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doSetPrimaryAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.session.userAuthId;
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
        status : 'success'
    })
  } catch (error) {
    console.log(error);
  }
};

module.exports.getEditUserProfile = async (req, res) => {
  try {
    const user = await userSchema.findOne({_id: req.session.userAuthId});
    res.render("user/editProfile.ejs", {
      title: "Edit Profile",
      userdetail: user,
      user: req.session.userAuth,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getAddAddress = (req, res) => {
  try {
    res.render("user/addAddress.ejs", {
      title: "Add Address",
      user: req.session.userAuth,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doAddAddress = async (req, res) => {
  try {
    console.log(req.body);
    if (req.session.userAuthId) {
      const address = new addressSchema({
        fullName: req.body.fullName,
        mobile: req.body.mobile,
        address: req.body.address,
        district: req.body.district,
        state: req.body.state,
        pincode: req.body.pincode,
        userId: req.session.userAuthId,
      });
      const result = await address.save();
      await userSchema.updateOne(
        { _id: req.session.userAuthId },
        { $push: { addresses: result._id } }
      );
      res.redirect("/user/userprofile");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getEditAddress = (req, res) => {
  try {
    res.render("user/editAddress.ejs", {
      title: "Edit Address",
      user: req.session.userAuth,
    });
  } catch (error) {
    console.log(error);
  }
};
