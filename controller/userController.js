

const User = require('../models/user')
const message = require('../twilio')
const bcrypt = require('bcrypt')
const Products = require('../models/products')
const Orders = require('../models/order')
const Razorpay = require('razorpay')
const Payments = require('../models/payment')
const Categories = require('../models/category')
const crypto = require('crypto')

const Coupons = require('../models/coupon')
const paypal = require('@paypal/checkout-server-sdk')
const { default: mongoose } = require('mongoose')
const Banner = require('../models/banner')
const Environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
const paypalClient = new paypal.core.PayPalHttpClient(Environment)

module.exports = {

  getLogin: (req, res) => {
    if (req.session.message) {
      const message = req.session.message
      req.session.message = ''
      return res.render('login', { message })
    } else {
      const message = ''
      return res.render('login', { message })
    }
  },

  getRegister: (req, res) => {
    if (req.session.message) {
      const message = req.session.message
      req.session.message = ''
      return res.render('register', { message })
    } else {
      const message = ''
      return res.render('register', { message })
    }
  },
  getLandingpage: async (req, res) => {
    const banner = await Banner.findOne({ setCurrent: true })
    const products = await Products.find({ isDeleted: false })

    return res.render('landingpage', { products, banner })
  },
  getHomepage: async (req, res) => {
    const banner = await Banner.findOne({ setCurrent: true })
    const products = await Products.find({ isDeleted: false }).populate('categoryId')
    const user = await User.find({ isBlocked: false })
    const category = await Categories.find({ isDeleted: false })
    return res.render('userhome', { products, user, category, banner })
  },
  getOtp: (req, res) => {
    return res.render('otp')
  },

  saveUser: async (req, res) => {
    const storeuser = ({
      username: req.body.username,
      email: req.body.email,
      number: req.body.number,
      password: req.body.password
    })
    req.session.storeuser = storeuser

    const email = await User.find({ email: req.body.email })
    const number = await User.find({ number: req.body.number })
    if (email.length == 0) {
      if (number.length != 0) {
        req.session.message = 'Number already exist'
        return res.redirect('/register')
      } else {
        try {
          await message.sentotp(req.session.storeuser.number)
          res.redirect('./otp')
        } catch {
          res.render('404')
        }
      }
    } else {
      req.session.message = 'Email already exist'
      return res.redirect('/register')
    }
  },
  addUser: async (req, res) => {
    try {
      const storeuser = new User({
        username: req.session.storeuser.username,
        email: req.session.storeuser.email,
        number: req.session.storeuser.number,
        password: req.session.storeuser.password
      })
      const otp = req.body.otp

      if (otp.length == 0) {
        req.session.message = 'Enter otp'
        return res.redirect('/otp')
      } else {
        const check = await message.check(otp, req.session.storeuser.number)
        if (check.status == 'approved') {
          await storeuser.save()
          req.session.message = ''
          res.redirect('./login')
        } else {
          req.session.message = 'Invalid otp'
          res.redirect('/otp')
        }
      }
    } catch (err) {
      res.render('404')
    }
  },

  resendOtp: async (req, res) => {
    try {
      await message.sentotp(req.session.storeuser.number)
      return res.redirect('/otp')
    } catch (err) {
      res.render('404')
    }
  },
  redirectHomepage: async (req, res) => {
    const user = await User.find({ email: req.body.email })
    const datapassword = user[0].password

    if (user.length != 0) {
      const password1 = req.body.password
      const match = await bcrypt.compare(password1, datapassword)

      if (!match) {
        req.session.message = 'password not correct'
        res.redirect('/login')
      } else if (user[0].isBlocked) {
        req.session.message = 'User is Blocked'
        res.redirect('/login')
      } else {
        req.session.user = user[0]
        return res.redirect('/home')
      }
    } else {
      req.session.message = 'Invalid User'
      res.redirect('/login')
    }
  },

  getUserlogout: (req, res) => {
    req.session.user = ''
    res.redirect('/login')
  },
  getProductdetails: (req, res) => {
    const user = User.findOne({ id: req.session.user.id })
    return res.render('user/product-details', { user })
  },
  getDetailspage: async (req, res) => {
    try {
      const productId = req.params.id
      const product = await Products.findById(productId)
      return res.render('user/product-details', { product })
    } catch (err) {
      res.render('404')
    }
  },

  getadddetails: async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const shippingAddress = user.shippingAddress
    return res.render('user/adddetails', { user, shippingAddress })
  },
  editUser: async (req, res) => {

    try {
      const edituser = ({
        username: req.body.username,
        email: req.body.email,
        number: req.body.number

      })
      req.session.edituser = edituser
      const number = req.body.number

      req.session.otpnumber = number
      await message.sentotp(number)

      return res.redirect('/otpedit')
    } catch (err) {
      res.render('404')
    }
  },
  editUserwithOtp: async (req, res) => {
    try {
      const otp = req.body.otp
      if (otp.length == 0) {
        req.session.message = 'Enter otp'
        return res.redirect('/otp')
      } else {
        const check = await message.check(otp, req.session.otpnumber)

        if (check.status == 'approved') {
          await User.findByIdAndUpdate({ _id: req.session.user._id }, req.session.edituser)

          req.session.edituser = ''
          req.session.otpnumber = ''
          req.session.message = ''
          return res.redirect('/adddetails')
        } else {
          req.session.message = 'Invalid otp'
          res.redirect('/otpedit')
        }
      }
    } catch (err) {
      res.render('404')
    }
  },

  getOrder: async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const orders = await Orders.find({ customerId: req.session.user._id }).sort({ createdAt: -1 })
    return res.render('user/order-details', { orders, user })
  },

  orderCancel: async (req, res) => {
    try {
      const id = req.body.id
      await Orders.findByIdAndUpdate({ _id: id }, {
        $set: { cancelled: true }
      })
      return res.json({
        successStatus: true
      })
    } catch (err) {

    }
  },
  getAddressadd: async (req, res) => {
    if (req.session.message) {
      const message = req.session.message
      req.session.message = ''
      const user = await User.findById(req.session.user)
      return res.render('user/address-editing', { user, message })
    } else {
      const message = ''
      const user = await User.findById(req.session.user)
      return res.render('user/address-editing', { user, message })
    }
  },
  addAddress: async (req, res) => {
    try {
      if (!req.body.address) {
        req.session.message = 'Enter Address'
        return res.redirect('/address/edit')
      } else if (!req.body.pincode) {
        req.session.message = 'Enter a pincode'
        return res.redirect('/address/edit')
      } else {
        const address = {
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          pincode: req.body.pincode
        }

        await User.findOneAndUpdate({ _id: req.session.user._id }, { $push: { shippingAddress: address } })
        return res.redirect('/adddetails')
      }
    } catch (err) {
      res.render('404')
    }
  },

  paymentVerify: async (req, res) => {
    try {

      let hmac = crypto.createHmac('sha256', 'ATfwtRsjdXfheN7TgrLiqtG7')
      hmac.update(req.body.payment.razorpay_order_id + '|' + req.body.payment.razorpay_payment_id)
      hmac = hmac.digest('hex')
      if (hmac == req.body.payment.razorpay_signature) {
        const order = await Orders.findOneAndUpdate({ _id: req.body.order.receipt }, {
          $set: {
            orderStatus: 'Placed',
            paymentVerified: true
          }
        })
        for (const item of order.items) {
          const productId = item.productId
          const count = item.quantity
          await Products.findOneAndUpdate({ _id: productId }, { $inc: { totalStoke: -count } })
          await User.findOneAndUpdate({ _id: req.session.user._id, 'cart.productId': productId }, { $set: { cartTotal: 0 } })
        }
        await User.findOneAndUpdate({ id: req.session.user.id }, { $set: { cart: [] } })

        const payment = new Payments({
          orderId: req.body.order.receipt,
          customerId: req.session.user._id,
          paymentId: req.body.payment.razorpay_payment_id,
          razorpayOrderId: req.body.payment.razorpay_order_id,
          paymentSignature: req.body.payment.razorpay_signature,
          status: true
        })
        await payment.save()
        req.session.orderplaced = true
        req.session.couponApplied = null
        return res.json({ successStatus: true })
      } else {
        await Orders.findOneAndUpdate({ _id: req.body.order.receipt }, {
          $set: {
            cancelled: true
          }
        })
        return res.json({ successStatus: false })
      }
    } catch (err) {
      res.render('404')
    }
  },
  paymentCancel: async (req, res) => {
    try {
      await Orders.findOneAndUpdate({ _id: req.body.order.receipt }, {
        $set: {
          cancelled: true
        }
      })
      res.json({ successStatus: true })
    } catch (error) {

      res.json({ successStatus: false })
    }
  },
  paymentFail: async (req, res) => {
    try {
      const payment = new Payments({
        orderId: req.body.order.receipt,
        customerId: req.session.user._id,
        paymentId: req.body.payment.error.metadata.payment_id,
        razorpayOrderId: req.body.payment.error.metadata.order_id,
        status: false
      })
      await payment.save()
      const order = await Orders.findOneAndUpdate({ _id: req.body.order.receipt }, {
        $set: {
          cancelled: true
        }
      })

      res.json({ successStatus: true })
    } catch (error) {
      res.render('404')
    }
  },

  addCoupon: async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.session.user._id })
        .populate('cart.productId')
      const coupon1 = await Coupons.find({ coupon: req.body.coupon })

      const total = user.cartTotal


      if (coupon1[0].users.includes(req.session.user._id)) {
        return res.json({
          successStatus: false,
          message: 'You have already used the coupon'
        })
      }

      let discount
      if (coupon1[0].isPercentage) {
        discount = total * coupon1[0].discount / 100
      } else {
        discount = (coupon1[0].discount)
      }


      req.session.addeddiscount = {
        discount,
        couponId: coupon1[0].id,
        coupon: coupon1[0].coupon
      }

      const discountprice = total - discount

      await Coupons.findOneAndUpdate({ coupon: req.body.coupon }, { $push: { users: req.session.user._id } })

      res.json({
        successStatus: true,
        discountprice,
        discount
      })
    } catch (err) {

      res.json({
        successStatus: false
      })
    }
  },
  getForgetPassword: async (req, res) => {
    if (req.session.message) {
      const message = req.session.message
      req.session.message = ''
      return res.render('user/forget-password', { message })
    }
    const message = ''
    return res.render('user/forget-password', { message })
  },
  forgotPassword: async (req, res) => {
    try {
      const mobilenumber = req.body.number
      req.session.mobilenumber = mobilenumber

      const number = await User.find({ number: req.body.number })
      if (!req.body.number) {
        req.session.message = 'Enter a Mobile Number'
        return res.redirect('/forgot-password')
      } else if (!/^([0|\+[0-9]{1,5})?([7-9][0-9]{9})$/.test(String(mobilenumber))) {
        req.session.message = 'Enter a valid Mobile Number'
        return res.redirect('/forgot-password')
      } else if (number.length <= 0) {
        req.session.message = 'Enter registered mobile number'
        return res.redirect('/forgot-password')
      } else if (number.length > 0) {
        await message.sentotp(mobilenumber)
        res.redirect('/otpforgot')
      }
    } catch (err) {
      res.render('404')
    }
  },
  getOtpforgot: (req, res) => {
    return res.render('user/otp-forgot')
  },
  checkForgot: async (req, res) => {
    const otp = req.body.otp

    if (otp.length == 0) {
      req.session.message = 'Enter otp'
      return res.redirect('/otpforgot')
    } else {
      const check = await message.check(otp, req.session.mobilenumber)
      if (check.status == 'approved') {
        req.session.message = ''
        return res.redirect('/edit-password')
      } else {
        req.session.message = 'Invalid Otp'
        return res.redirect('/otpforgot')
      }
    }
  },
  getEditPassword: (req, res) => {
    return res.render('user/edit-password')
  },
  editPassword: async (req, res) => {
    try {
      const newpassword = req.body.newpassword
      const password = await bcrypt.hash(newpassword, 10)

      await User.findOneAndUpdate({ number: req.session.mobilenumber }, { $set: { password } })
      res.redirect('/login')
    } catch (err) {
      res.render('404')
    }
  },
  deleteAddress: async (req, res) => {
    try {

      const id = req.body.id
      const addressId = req.body.addressId

      await User.findOneAndUpdate({ _id: req.session.user._id }, { $pull: { shippingAddress: { _id: addressId } } })
      res.json({
        successStatus: true
      })
    } catch (err) {
      res.json({
        successStatus: false
      })
    }
  },
  getOtpEdit: (req, res) => {
    if (req.session.message) {
      const message = req.session.message
      req.session.message = ''
      res.render('user/otp-edit', { message })
    } else {
      const message = ''
      res.render('user/otp-edit', { message })
    }
  },
  getViewOrderDetails: async (req, res) => {
    const orderId = req.session.orderId
    const product = await Orders.find({ _id: orderId }).populate('customerId')
    
    req.session.orderId = ''
    return res.render('user/order-product', { product })
  },

  viewOrderDetails: async (req, res) => {
    const id = req.body.id
   
    const product = await Orders.find({ _id: id })
    
    req.session.orderId = id
    return res.json({
      successStatus: true,
      product,
      redirect: '/user/order-product'
    })
  },

  getShop: async (req, res) => {
    try {
      
      let searchWord
      let products
      let user
      let category = await Categories.find({ isDeleted: false })
      let categoryForfilter = []
      let pages

      const perPage = 4
      const page = req.session.page || 1
      const totalCount = await Products.aggregate(
        [
          {
            $match:

            {
              isDeleted: false
            }
          },
          {
            $count:
              'productname'
          }
        ])


      pages = Math.ceil((totalCount[0].productname) / perPage)

      const from = req.session.from || 0
      const to = req.session.to || 100000

      if (req.session.searchWord) {
        user = await User.find({ isBlocked: false })
        category = await Categories.find({ isDeleted: false })
        searchWord = req.session.searchWord
        req.session.searchWordforFilter = req.session.searchWord
        pages = 0
        req.session.searchWord = ''
        products = await Products.aggregate([
          {
            $lookup: {
              from: 'categories',
              localField: 'categoryId',
              foreignField: '_id',
              as: 'categoryId'
            }
          },
          {
            $unwind: '$categoryId'
          },

          {
            $match: {
              isDeleted: false
            }
          },
          {
            $match: {
              $or: [
                { productname: new RegExp(searchWord, 'i') },
                { color: new RegExp(searchWord, 'i') },
                { 'categoryId.categoryname': new RegExp(searchWord, 'i') }
              ]
            }
          },


        ])
        // .skip((page - 1) * perPage).limit(perPage)
      } else if (req.session.productCategory) {
        searchWord = req.session.searchWordinFilter
        req.session.productCategory.forEach(item => {
          categoryForfilter.push(mongoose.Types.ObjectId(item))

        })
        pages = 0
        req.session.productCategory = null
        products = await Products.aggregate([
          {
            $unwind: '$categoryId'
          },
          {
            $match: {
              isDeleted: false,
              $or: [
                { productname: new RegExp(searchWord, 'i') },
                { color: new RegExp(searchWord, 'i') },
                { 'categoryId.categoryname': new RegExp(searchWord, 'i') }
              ],
              categoryId: { $in: categoryForfilter }
            }
          },
          {
            $sort: {
              categoryId: 1
            }
          }

        ])
        // .skip((page-1) * perPage).limit(perPage)

      } else if (req.session.from || req.session.to) {
        searchWord = req.session.searchWordinFilter
        req.session.from = null
        req.session.to = null
        pages = 0
        req.session.productCategory = null
        products = await Products.aggregate([
          {
            $unwind: '$categoryId'
          },

          {
            $match: {
              isDeleted: false,
              $or: [
                { productname: new RegExp(searchWord, 'i') },
                { color: new RegExp(searchWord, 'i') },
                { 'categoryId.categoryname': new RegExp(searchWord, 'i') }
              ],

              $and: [
                { price: { $gte: parseInt(from) } },
                { price: { $lte: parseInt(to) } }
              ]

            }
          },
          {
            $sort: {
              categoryId: 1
            }
          }
        ])
        // .skip((page - 1) * perPage).limit(perPage)
      } else {
        
        req.session.searchWordinFilter = ''
        req.session.searchWordforFilter = ''
        products = await Products.find({ isDeleted: false }).populate('categoryId').skip((page - 1) * perPage).limit(perPage)

        category = await Categories.find({ isDeleted: false })
        searchWord = ''


        user = await User.find({ isBlocked: false })
      }

      return res.render('user/shop', { products, user, category, pages, searchWord })
    } catch (err) {
      res.render('404')
    }
  },

  Search: (req, res) => {
    const searchWord = req.query.search.replace(/[^a-zA-Z0-9 ]/g, '')
    req.session.searchWord = searchWord
    res.redirect('/shop')
  },

  filterProducts: (req, res) => {
    req.session.from = req.query.from
    req.session.to = req.query.to
    const searchWordinFilter = req.session.searchWordforFilter

    req.session.searchWordinFilter = searchWordinFilter
   
    req.session.productCategory = req.query.category

    res.redirect('/shop')
  },

  changePage: async (req, res) => {
    const user = req.session.user
    const category = await Categories.find({ isDeleted: false })
    searchWord = ''
    const page = req.query.page
    req.session.page = page
   
    let products
    let pages
    if (req.session.page) {
      const page = req.session.page
      const perPage = 4
      products = await Products.find({ isDeleted: false }).skip((page - 1) * perPage).limit(perPage)
      const totalCount = await Products.aggregate(
        [
          {
            $match:
            {
              isDeleted: false
            }
          },
          {
            $count: 'productname'
          }
        ])


      pages = Math.ceil((totalCount[0].productname) / perPage)
    }

    return res.render('user/shop', { products, user, category, pages, searchWord })
  },

  get404: (req, res) => {
    res.render('404')
  }

}
