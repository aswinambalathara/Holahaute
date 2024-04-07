const express = require('express')
const router = express.Router();
const shopController = require('../controllers/shopController');
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const offerController = require ('../controllers/offerController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/home',shopController.getHomePage);
router.get('/productdetail/:id',shopController.getProductDetailPage); 
router.get('/shop',shopController.getProductsPage); 
router.post('/search',shopController.doSearch);
router.post('/shop/filter',shopController.doFilter);
router.get('/offers',offerController.getOffers);

//userRoutes
router.get('/user/userprofile',authMiddleware.userStatus,authMiddleware.verifyUser,userController.getUserProfile);
router.get('/user/editprofile',authMiddleware.userStatus,authMiddleware.verifyUser,userController.getEditUserProfile);
router.patch('/user/editprofile',authMiddleware.userStatus,authMiddleware.verifyUser,userController.DoEditUserProfile);
router.patch('/user/userprofile/setprimary/:id',authMiddleware.userStatus,authMiddleware.verifyUser,userController.doSetPrimaryAddress);
router.patch('/user/changepassword',authMiddleware.verifyUser,authMiddleware.userStatus,userController.DochangeUserPassword);
router.patch('/user/otp_changepassword',authMiddleware.verifyUser,authMiddleware.userStatus,userController.DochangePasswordWithOtp);

router.get('/user/addaddress',authMiddleware.userStatus,authMiddleware.verifyUser,userController.getAddAddress);
router.post('/user/addaddress',authMiddleware.userStatus,authMiddleware.verifyUser,userController.doAddAddress);
router.patch('/user/removeaddress/:id',authMiddleware.userStatus,authMiddleware.verifyUser,userController.doUnlistAddress);
router.get('/user/editaddress/:id',authMiddleware.userStatus,authMiddleware.verifyUser,userController.getEditAddress); 
router.patch('/user/editaddress/:id',authMiddleware.userStatus,authMiddleware.verifyUser,userController.doEditAddress);

router.post('/user/wallet/addmoney',authMiddleware.userStatus,authMiddleware.verifyUser,userController.doAddWalletMoney);
router.post('/user/wallet/verifywalletpayment',authMiddleware.userStatus,authMiddleware.verifyUser,userController.doVerifyWalletPayment);
router.get('/user/wallet/history',authMiddleware.userStatus,authMiddleware.verifyUser,userController.getWalletHistory);
 
//cartRoutes

router.get('/cart',authMiddleware.userStatus,authMiddleware.verifyUser,cartController.getCart);
router.post('/add_to_cart/:id',authMiddleware.userStatus,authMiddleware.verifyUser,cartController.doAddToCart);
router.patch('/cart/updatequantity',authMiddleware.userStatus,authMiddleware.verifyUser,cartController.doUpdateQuantity);
router.patch('/cart/removeitem/:id',authMiddleware.userStatus,authMiddleware.verifyUser,cartController.doRemoveItem);
router.get('/checkout',authMiddleware.userStatus,authMiddleware.verifyUser,cartController.getCartCheckOut);
router.post('/placeorder',authMiddleware.userStatus,authMiddleware.verifyUser,orderController.doCartPlaceOrder);
router.post('/verifypayment',authMiddleware.userStatus,authMiddleware.verifyUser,orderController.doverifyPayment);
router.post('/checkout/applycoupon',authMiddleware.userStatus,authMiddleware.verifyUser,cartController.doApplyCoupon);
router.post('/checkout/removecoupon',authMiddleware.userStatus,authMiddleware.verifyUser,cartController.doRemoveCoupon);
router.post('/checkout/applywallet',authMiddleware.userStatus,authMiddleware.verifyUser,cartController.doApplyWallet);
router.post('/checkout/uncheckwallet',authMiddleware.userStatus,authMiddleware.verifyUser,cartController.doUncheckWallet);

//orders

router.get('/orderstatus',authMiddleware.userStatus,authMiddleware.verifyUser,orderController.getOrderStatusPage);
router.get('/myorders',authMiddleware.userStatus,authMiddleware.verifyUser,orderController.getMyorders);
router.get('/myorders/order/:id',authMiddleware.userStatus,authMiddleware.verifyUser,orderController.getOrderDetail);
router.get('/myorders/trackorder/:id',authMiddleware.userStatus,authMiddleware.verifyUser,orderController.getOrderTracking);
router.patch('/myorder/cancelorder/:id',authMiddleware.userStatus,authMiddleware.verifyUser,orderController.doCancelOrder);
router.post('/myorders/rateproduct',authMiddleware.userStatus,authMiddleware.verifyUser,userController.doProductRating);

//wishlist

router.get('/wishlist',authMiddleware.userStatus,authMiddleware.verifyUser,shopController.getWishlist);
router.post('/wishlist/add',authMiddleware.userStatus,authMiddleware.verifyUser,shopController.addToWishlist);
router.patch('/wishlist/remove',authMiddleware.userStatus,authMiddleware.verifyUser,shopController.removeFromWishList);
router.get('/wishlist/fetchproductoptions/:id',authMiddleware.userStatus,authMiddleware.verifyUser,shopController.fetchProductOptions);
router.post('/wishlist/addtocart/:id',authMiddleware.userStatus,authMiddleware.verifyUser,cartController.doAddToCart);



module.exports = router;