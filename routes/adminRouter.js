const express = require('express')
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const authMiddleware = require('../middlewares/authMiddleware');
const {uploadCatogory,uploadBanner,uploadProduct} = require('../middlewares/multer')

router.get('/',authMiddleware.isAdminAuth,adminController.getAdminDashboard)

router.get('/products',authMiddleware.isAdminAuth,productController.getAdminProducts)
router.get('/products/addproduct',authMiddleware.isAdminAuth,productController.getAddProducts)
router.post('/products/addproduct',authMiddleware.isAdminAuth,uploadProduct.array('images',4),productController.doAddProducts)
router.get('/products/editproduct/:id',authMiddleware.isAdminAuth,productController.getEditProducts)
router.patch('/products/editproduct/:id',authMiddleware.isAdminAuth,uploadProduct.array('images',4),productController.doEditProducts)
router.patch('/products/deleteproduct/:id',authMiddleware.isAdminAuth,productController.doDeleteProducts); 


router.get('/users',authMiddleware.isAdminAuth,adminController.getAdminUsers);
router.patch('/users/blockuser/:id',authMiddleware.isAdminAuth,adminController.doUserBlock);
router.patch('/users/unblockuser/:id',authMiddleware.isAdminAuth,adminController.doUserUnBlock);

router.get('/category',authMiddleware.isAdminAuth,categoryController.getAdminCategory)
router.get('/category/addcategory',authMiddleware.isAdminAuth,categoryController.getAddCategory) 
router.post('/category/addcategory',authMiddleware.isAdminAuth,uploadCatogory.single('image'),categoryController.doAddCategory) 
router.get('/category/editcategory/:id',authMiddleware.isAdminAuth,categoryController.getEditCategory)
router.patch('/category/editcategory/:id',authMiddleware.isAdminAuth,uploadCatogory.single('image'),categoryController.doEditCategory)
router.patch('/category/deletecategory/:id',authMiddleware.isAdminAuth,categoryController.doDeleteCategory)


module.exports = router;