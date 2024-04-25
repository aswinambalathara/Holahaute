const express = require('express')
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/',(req,res)=>{
    res.redirect('/home')
});

//userLogin
router.get('/login',authMiddleware.isUserLoggedOut,authController.getUserLogin); 
router.post('/login',authMiddleware.isUserLoggedOut,authController.doUserLogin);

router.post('/auth/googlesignin',authMiddleware.isUserLoggedOut,authController.doGoogleLogin)

//userLogin_with_OTP
router.get('/otplogin',authMiddleware.isUserLoggedOut,authController.getOtpLogin)
router.post('/sendotp',authController.sendOtpLogin) 
router.post('/otplogin',authController.doOtpLogin)

//userSignUP
router.get('/signup',authController.getUserSignup); 
router.post('/signup',authController.doUserSignup);  

router.get('/otpverification',authMiddleware.isnewUser,authController.getSignupverification);
router.post('/otpverification',authController.doSignupverification);

router.post('/resendotp',authController.doResendOTP);
//userForgotPassword
router.get('/forgotpassword',authController.getForgotPassword);
router.post('/forgotpassword',authController.doForgotPassword);
router.post('/forgotpassword/sendotp',authController.sendForgotOtp)
router.get('/changepassword',authController.getChangePassword);
router.patch('/changepassword',authController.doChangePassword);

//adminLogin
router.get('/admin/login',authMiddleware.isAdminLoggedOut,authController.getAdminLogin);
router.post('/admin/login',authController.doAdminLogin);
router.get('/logout',authController.userLogOut);
router.get('/adminlogout',authController.adminLogOut);

module.exports = router;