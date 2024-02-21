const express = require('express')
const router = express.Router();
const shopController = require('../controllers/shopController')
 const authMiddleware = require('../middlewares/authMiddleware');

router.get('/home',shopController.getHomePage);
router.get('/productdetail/:id',shopController.getProductDetailPage);
router.get('/shop',shopController.getProductsPage);


module.exports = router 