const express = require('express')
const router = express.Router();
const shopController = require('../controllers/shopController');
const userController = require('../controllers/userController');
 const authMiddleware = require('../middlewares/authMiddleware');

router.get('/home',shopController.getHomePage);
router.get('/productdetail/:id',shopController.getProductDetailPage);
router.get('/shop',shopController.getProductsPage);

//userRoutes

router.get('/userprofile',userController.getUserProfile);
router.get('/editprofile',userController.getEditUserProfile);
module.exports = router 