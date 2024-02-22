const express = require('express')
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const authMiddleware = require('../middlewares/authMiddleware');
const {uploadCatogory,uploadBanner,uploadProduct} = require('../middlewares/multer')

router.get('/',adminController.getAdminDashboard)

router.get('/products',productController.getAdminProducts)
router.get('/products/addproduct',productController.getAddProducts)
router.post('/products/addproduct',uploadProduct.array('images',4),productController.doAddProducts)
router.get('/products/editproduct/:id',productController.getEditProducts)
router.patch('/products/editproduct/:id',uploadProduct.array('images',4),productController.doEditProducts)
router.patch('/products/deleteproduct/:id',productController.doDeleteProducts);


router.get('/users',adminController.getAdminUsers);
router.patch('/users/blockuser/:id',adminController.doUserBlock);
router.patch('/users/unblockuser/:id',adminController.doUserUnBlock);

router.get('/category',categoryController.getAdminCategory)
router.get('/category/addcategory',categoryController.getAddCategory) 
router.post('/category/addcategory',uploadCatogory.single('image'),categoryController.doAddCategory) 
router.get('/category/editcategory/:id',categoryController.getEditCategory)
router.patch('/category/editcategory/:id',uploadCatogory.single('image'),categoryController.doEditCategory)
router.patch('/category/deletecategory/:id',categoryController.doDeleteCategory)


module.exports = router;