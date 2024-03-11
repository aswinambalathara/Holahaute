const express = require('express')
const router = express.Router();
const shopController = require('../controllers/shopController');
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
 const authMiddleware = require('../middlewares/authMiddleware');

router.get('/home',shopController.getHomePage);
router.get('/productdetail/:id',shopController.getProductDetailPage);
router.get('/shop',shopController.getProductsPage);
router.post('/search',shopController.doSearch);
//userRoutes

router.get('/user/userprofile',authMiddleware.userStatus,authMiddleware.isUserAuth,userController.getUserProfile);
router.get('/user/editprofile',authMiddleware.userStatus,authMiddleware.isUserAuth,userController.getEditUserProfile);
router.patch('/user/editprofile',authMiddleware.userStatus,authMiddleware.isUserAuth,userController.DoEditUserProfile);
router.patch('/user/userprofile/setprimary/:id',authMiddleware.userStatus,authMiddleware.isUserAuth,userController.doSetPrimaryAddress);
router.post('/user/sendotp',authMiddleware.userStatus,authMiddleware.isUserAuth,userController.sendOtp);
//router.post('/user/changepassword',userController.doChangePassword);

router.get('/user/addaddress',authMiddleware.userStatus,authMiddleware.isUserAuth,userController.getAddAddress);
router.post('/user/addaddress',authMiddleware.userStatus,authMiddleware.isUserAuth,userController.doAddAddress);
router.patch('/user/removeaddress/:id',authMiddleware.userStatus,authMiddleware.isUserAuth,userController.doUnlistAddress);
router.get('/user/editaddress/:id',authMiddleware.userStatus,authMiddleware.isUserAuth,userController.getEditAddress); 
router.patch('/user/editaddress/:id',authMiddleware.userStatus,authMiddleware.isUserAuth,userController.doEditAddress);
//cartRoutes

router.get('/cart',authMiddleware.isUserAuth,cartController.getCart);

module.exports = router 