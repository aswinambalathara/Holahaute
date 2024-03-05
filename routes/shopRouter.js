const express = require('express')
const router = express.Router();
const shopController = require('../controllers/shopController');
const userController = require('../controllers/userController');
 const authMiddleware = require('../middlewares/authMiddleware');

router.get('/home',shopController.getHomePage);
router.get('/productdetail/:id',shopController.getProductDetailPage);
router.get('/shop',shopController.getProductsPage);

//userRoutes

router.get('/user/userprofile',authMiddleware.isUserAuth,userController.getUserProfile);
router.get('/user/editprofile',authMiddleware.isUserAuth,userController.getEditUserProfile);
router.patch('/user/userprofile/setprimary/:id',userController.doSetPrimaryAddress);

router.get('/user/addaddress',authMiddleware.isUserAuth,userController.getAddAddress);
router.post('/user/addaddress',userController.doAddAddress);
router.patch('/user/removeaddress/:id',userController.doUnlistAddress);
router.get('/user/editaddress',authMiddleware.isUserAuth,userController.getEditAddress); 
module.exports = router 