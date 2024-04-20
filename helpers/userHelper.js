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

module.exports.generateReferralCode=()=>{
  const charSet = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    digits: "0123456789"
  };

  let code = "";
  let includedCategories = [];

  for (const category in charSet) {
    code += charSet[category].charAt(Math.floor(Math.random() * charSet[category].length));
    includedCategories.push(category);
  }

  for (let i = code.length; i < 6; i++) {
    const randomCategory = includedCategories[Math.floor(Math.random() * includedCategories.length)];
    code += charSet[randomCategory].charAt(Math.floor(Math.random() * charSet[randomCategory].length));
  }
console.log(code)
  return code;

}


