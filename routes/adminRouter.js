const express = require('express')
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const offerController = require('../controllers/offerController');
const bannerController = require ('../controllers/bannerController');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const {uploadCatogory,uploadBanner,uploadProduct} = require('../middlewares/multer');
const { auth } = require('google-auth-library');

router.get('/',authMiddleware.verifyAdmin,adminController.getAdminDashboard);
router.post('/generatesaleschart',authMiddleware.verifyAdmin,adminController.generateSales);
router.post('/generatersalesreport',authMiddleware.verifyAdmin,adminController.generateSalesReport);

router.get('/products',authMiddleware.verifyAdmin,productController.getAdminProducts)
router.get('/products/addproduct',authMiddleware.verifyAdmin,productController.getAddProducts)
router.post('/products/addproduct',authMiddleware.verifyAdmin,uploadProduct.array('images',4),productController.doAddProducts)
router.get('/products/editproduct/:id',authMiddleware.verifyAdmin,productController.getEditProducts)
router.patch('/products/editproduct/:id',authMiddleware.verifyAdmin,uploadProduct.array('images',4),productController.doEditProducts)
router.patch('/products/deleteproduct/:id',authMiddleware.verifyAdmin,productController.doDeleteProducts); 


router.get('/users',authMiddleware.verifyAdmin,adminController.getAdminUsers);
router.patch('/users/blockuser/:id',authMiddleware.verifyAdmin,adminController.doUserBlock);
router.patch('/users/unblockuser/:id',authMiddleware.verifyAdmin,adminController.doUserUnBlock);

router.get('/category',authMiddleware.verifyAdmin,categoryController.getAdminCategory)
router.get('/category/addcategory',authMiddleware.verifyAdmin,categoryController.getAddCategory) 
router.post('/category/addcategory',authMiddleware.verifyAdmin,uploadCatogory.single('image'),categoryController.doAddCategory) 
router.get('/category/editcategory/:id',authMiddleware.verifyAdmin,categoryController.getEditCategory)
router.patch('/category/editcategory/:id',authMiddleware.verifyAdmin,uploadCatogory.single('image'),categoryController.doEditCategory)
router.patch('/category/deletecategory/:id',authMiddleware.verifyAdmin,categoryController.doDeleteCategory)

router.get('/orders',authMiddleware.verifyAdmin,adminController.getAdminOrders);
router.get('/orders/orderinfo/:id',authMiddleware.verifyAdmin, adminController.getAdminOrderInfo);
router.patch('/orders/changestage/:id',authMiddleware.verifyAdmin,adminController.doChangeOrderStage);
//router.patch('/orders/cancelorder',authMiddleware.verifyAdmin,adminController.doAdminCancelOrder);

router.get('/coupons',authMiddleware.verifyAdmin,adminController.getAdminCoupons);
router.post('/coupons/addcoupon',authMiddleware.verifyAdmin,adminController.doAddCoupon);
router.get('/coupons/fetchCoupon/:id',authMiddleware.verifyAdmin,adminController.doFetchCoupon);
router.patch('/coupons/editcoupon/:id',authMiddleware.verifyAdmin,adminController.doEditCoupon);
router.delete('/coupons/deletecoupon/:id',authMiddleware.verifyAdmin,adminController.doDeleteCoupon);


router.get('/offers',authMiddleware.verifyAdmin,offerController.getAdminOffers);
router.get('/offers/addoffer',authMiddleware.verifyAdmin,offerController.getAddOffer);
router.post('/offers/fetchproductlist',authMiddleware.verifyAdmin,offerController.fetchProductList);
router.post('/offers/addoffer',authMiddleware.verifyAdmin,offerController.doAddOffer);
router.get('/offers/editoffer/:id',authMiddleware.verifyAdmin,offerController.getEditOffer);
router.patch('/offers/editoffer/:id',authMiddleware.verifyAdmin,offerController.doEditOffer);
router.patch('/offers/deleteoffer/:id',authMiddleware.verifyAdmin,offerController.doUnlistOffer);

//banners
router.get('/banners',authMiddleware.verifyAdmin,bannerController.getBannerManagement);
router.get('/banners/addbanner',authMiddleware.verifyAdmin,bannerController.getAddBanner);
router.post('/banners/addbanner',authMiddleware.verifyAdmin,uploadBanner.single('bannerImage'),bannerController.doAddBanner);
router.get('/banners/editbanner/:id',authMiddleware.verifyAdmin,bannerController.getEditBanner);
router.patch('/banners/editbanner/:id',authMiddleware.verifyAdmin,uploadBanner.single('bannerImage'),bannerController.doEditBanner);
router.patch('/banners/deletebanner/:id',authMiddleware.verifyAdmin,bannerController.doUnlistBanner);
module.exports = router;