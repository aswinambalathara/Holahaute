const express = require('express')
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const authMiddleware = require('../middlewares/authMiddleware');
const {uploadCatogory,uploadBanner,uploadProduct} = require('../middlewares/multer')

router.get('/',authMiddleware.verifyAdmin,adminController.getAdminDashboard)

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
router.get('/orders/orderinfo',authMiddleware.verifyAdmin, adminController.getAdminOrderInfo);
router.patch('/orders/changestage',authMiddleware.verifyAdmin,adminController.doChangeOrderStage);
router.patch('/orders/cancelorder',authMiddleware.verifyAdmin,adminController.doAdminCancelOrder);


module.exports = router;