
const express = require('express')

const router = express.Router()
const bannerMiddleware = require('../middleware/bannerMiddleware')
const adminController = require('../controller/adminController')
const categoryController = require('../controller/categoryController')
const couponController = require('../controller/couponController')
const productController = require('../controller/productsController')
const orderController = require('../controller/orderController')
const bannerController = require('../controller/bannerController')
const session = require('../middleware/adminsession')
const { upload } = require('../db/multer')

// Admin routes
router.get('/', session.notLogged, adminController.getAdminlogin)
router.get('/dashhome', session.isLogged, adminController.getAdminhome)
router.get('/adminlogin', session.isLogged, adminController.getAdminhome)
router.post('/adminlogin', adminController.redirectAdminhome)
router.get('/logout', adminController.getAdminlogout)


// User routes
router.get('/users', session.isLogged, adminController.getUsers)
router.put('/userdata/:id', adminController.blockUser)

//banner routes
router.get('/banner', session.isLogged, bannerController.getBannersPage)
router.post('/banner', session.isLogged, bannerMiddleware.bannerUpload.single('image'), bannerController.saveBanner)
router.patch('/banner/:id', session.isLogged, bannerController.setCurrentBanner)
router.delete('/banner/:id', session.isLogged, bannerController.deleteBanner)


// Category routes
router.get('/categories', session.isLogged, categoryController.getCategories)
router.post('/categories/add', session.isLogged, categoryController.addCategory)
router.patch('/categories/:id', session.isLogged, categoryController.deleteCategory)

// Product routes
router.get('/products', session.isLogged, productController.getProducts)
router.patch('/product/product-details/:id', session.isLogged, productController.deleteProduct)
router.get('/products/addproducts', session.isLogged, productController.getAddproducts)
router.post('/products/editproducts/:id', session.isLogged, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }]), productController.editProduct)
router.get('/products/editproducts/:id', session.isLogged, productController.getEditproducts)
router.post('/products/addproducts', session.isLogged, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }]), productController.addProducts)


// Order routes
router.patch('/orders/cancel', session.isLogged, orderController.cancelOrder)
router.patch('/orders/change', session.isLogged, orderController.changeStatus)
router.get('/orders', session.isLogged, orderController.getOrders)
router.get('/order-details', session.isLogged, orderController.getOrderDetails)
router.get('/orders/view-details', session.isLogged, orderController.getOrderViewDetails)

// Coupon routes
router.get('/coupon', session.isLogged, couponController.getCoupon)
router.post('/coupon/add', session.isLogged, couponController.addCoupon)
router.patch('/coupons/:id', session.isLogged, couponController.deleteCoupon)
router.get('/editcoupon/:id', session.isLogged, couponController.getEditCoupon)
router.post('/editcoupon/:id', session.isLogged, couponController.updateCoupon)



// Sales routes
router.get('/sale-details', adminController.getSalesDetails)
router.get('/sales-report/pdf', adminController.salesReportPdf)
router.get('/sales-report/excel', session.isLogged, adminController.salesReportExcel);

router.post('/sales-details',)





module.exports = router
