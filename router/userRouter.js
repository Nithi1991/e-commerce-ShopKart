const express = require('express')
const router = express.Router()
const userController = require('../controller/userController')
const session = require('../middleware/userSession')
const cartController = require('../controller/cartController')
const paymentController = require('../controller/paymentController')


router.get('/login', session.notLogged, userController.getLogin)

router.get('/otp', session.notLogged, userController.getOtp)

router.get('/register', session.notLogged, userController.getRegister)

router.get('/', session.notLogged, userController.getLandingpage)

router.get('/home', session.isLogged, userController.getHomepage)

router.get('/productdetails', session.isLogged, userController.getProductdetails)

router.get('/product/details/:id', session.isLogged, userController.getDetailspage)

router.get('/register/resend', userController.resendOtp)

router.get('/logout', userController.getUserlogout)

router.get('/adddetails', session.isLogged, userController.getadddetails)

router.get('/checkout', session.isLogged, cartController.getCheckout)

router.get('/payment/cod', session.isLogged, paymentController.getOrdersucces)

router.get('/orders', session.isLogged, userController.getOrder)

router.get('/address/edit', session.isLogged, userController.getAddressadd)

router.get('/wishlist', session.isLogged, cartController.getWishlist)

router.get('/paymentfail', session.isLogged, paymentController.getPaymentfail)

router.get('/forgot-password', session.notLogged, userController.getForgetPassword)

router.get('/otpforgot', session.notLogged, userController.getOtpforgot)

router.get('/edit-password', session.notLogged, userController.getEditPassword)

router.get('/otpedit', session.notLogged, userController.getOtpEdit)

router.get('/user/order-product', session.isLogged, userController.getViewOrderDetails)

router.get('/shop', userController.getShop)

router.get('/search', userController.Search)

router.get('/products/filter', session.isLogged, userController.filterProducts)

router.get('/shop/next', session.isLogged, userController.changePage)

router.get('/cart', session.isLogged, cartController.getCart)

router.post('/register', session.notLogged, userController.saveUser)

router.post('/otp', session.notLogged, userController.addUser)

router.post('/login', session.notLogged, userController.redirectHomepage)

router.post('/edituser/:id', session.isLogged, userController.editUser)

router.post('/payment/cod/:discount', session.isLogged, paymentController.placeorderCod)

router.post('/add/address', session.isLogged, userController.addAddress)

router.post('/payment/razorpay', paymentController.placeorderRazorpay)

router.post('/create-paypalorder', session.isLogged, paymentController.paypalPayment)

router.post('/checkout/addcoupon', session.isLogged, userController.addCoupon)

router.post('/forgot-password', userController.forgotPassword)

router.post('/otp-forgot', userController.checkForgot)

router.post('/edit-password', userController.editPassword)

router.post('/otp-edituser', session.isLogged, userController.editUserwithOtp)

router.post('/orders/product/details', session.isLogged, userController.viewOrderDetails)

router.post('/payment/verify', session.isLogged, userController.paymentVerify)

router.post('/payment/cancel', session.isLogged, userController.paymentCancel)

router.post('/payment/fail', session.isLogged, userController.paymentFail)

router.patch('/cart/add', session.isLogged, cartController.addtoCart)

router.patch('/cart/remove', session.isLogged, cartController.removeCartItem)

router.patch('/cart/change', session.isLogged, cartController.changeQuantity)

router.patch('/orders/cancel', session.isLogged, userController.orderCancel)

router.patch('/wishlist/add', session.isLogged, cartController.addtoWishlist)

router.patch('/wish/remove', session.isLogged, cartController.removeWishItem)

router.patch('/wishlist/cart/add', session.isLogged, cartController.addtoCartfromWish)

router.patch('/delete/address', session.isLogged, userController.deleteAddress)


module.exports = router
