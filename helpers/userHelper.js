const userSchema = require('../models/userModel');
const verficationController = require('../controllers/verificationController');


module.exports.sendOtp = async (userId,email) => {
    try {
      const user = await userSchema.findOne({ _id: userId });
        const otp = verficationController.sendEmail(email);
        if(otp){
          user.token.otp = otp;
          user.token.generatedTime = Date.now()
         const updated = await user.save()
         if(updated){
          return updated
        }
      }
    } catch (error) {
      console.log(error);
    }
  };