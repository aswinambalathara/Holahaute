const userSchema = require('../models/userModel');
const verficationController = require('../controllers/verificationController');
const easyinvoice = require('easyinvoice');

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

module.exports.createInvoiceData = async (client,orderDetails,products) =>{
  try {
    let data = {
      apiKey: "free", // Please register to receive a production apiKey: https://app.budgetinvoice.com/register
      mode: "development", // Production or development, defaults to production   
      images: {
          // The logo on top of your invoice
          logo: "/images/logo/logo_1.png",
          // The invoice background
          background: "https://public.budgetinvoice.com/img/watermark-draft.jpg"
      },
      // Your own data
      sender: {
          company: "Hola Haute",
          address: "holaHaute,Thampanoor",
          zip: "695615",
          city: "Trivandrum",
          state:"Trivandrum",
          country: "India"
          // custom1: "custom value 1",
          // custom2: "custom value 2",
          // custom3: "custom value 3"
      },
      // Your recipient
      client: client,
      //object
      information: orderDetails,
      //object
      // The products you would like to see on your invoice
      // Total values are being calculated automatically
      products: products,
      // Array of objects


      // The message you would like to display on the bottom of your invoice
      bottomNotice: "Thank You for shopping with us",
      // Settings to customize your invoice
      
  };
  } catch (error) {
    console.error(error);
  }
}

