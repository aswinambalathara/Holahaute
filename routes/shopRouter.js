const express = require('express')
const router = express.Router();
const shopController = require('../controllers/shopController');
const userController = require('../controllers/userController');
 const authMiddleware = require('../middlewares/authMiddleware');

router.get('/home',shopController.getHomePage);
router.get('/productdetail/:id',shopController.getProductDetailPage);
router.get('/shop',shopController.getProductsPage);

//userRoutes

router.get('/user/userprofile',userController.getUserProfile);
router.get('/user/editprofile',userController.getEditUserProfile);
router.patch('/user/userprofile/setprimary/:id',userController.doSetPrimaryAddress);

router.get('/user/addaddress',userController.getAddAddress);
router.post('/user/addaddress',userController.doAddAddress);

router.get('/user/editaddress',userController.getEditAddress); 
module.exports = router 