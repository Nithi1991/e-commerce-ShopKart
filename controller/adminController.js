
const Adminregister = require('../models/admin')
const User = require('../models/user')
const Orders = require('../models/order')
const Products = require('../models/products')
const puppeteer = require('puppeteer')
const fs = require('fs');
const { Parser, transforms: { unwind } } = require('json2csv');
module.exports = {
  getAdminlogin: (req, res) => {
    if (req.session.message) {
      const message = req.session.message
      req.session.message = ''
      return res.render('admin/adminlogin', { message })
    } else {
      const message = ''
      return res.render('admin/adminlogin', { message })
    }
  },
  getAdminhome: async (req, res) => {
    const ordersCount = await Orders.aggregate([
      {
        $group: {
          _id: null,
          Count: { $sum: 1 },

        },
      },
    ])
    const usersCount = await User.aggregate([
      {
        $group: {
          _id: null,
          Count: { $sum: 1 },

        },
      },
    ])
    const productsCount = await Products.aggregate([
      {
        $group: {
          _id: null,
          Count: { $sum: 1 },

        },
      },
    ])
    return res.render('admin/home-dashboard', { ordersCount: ordersCount[0].Count, usersCount: usersCount[0].Count, productsCount: productsCount[0].Count })
  },
  redirectAdminhome: async (req, res) => {
    const admin = await Adminregister.find({ adminname: req.body.adminname })
    if (admin.length != 0) {
      if (admin[0].adminpassword != req.body.adminpassword) {
        req.session.message = 'password not correct'
        res.redirect('/admin')
      } else {
        req.session.admin = admin
        return res.redirect('/admin/adminlogin')
      }
    } else {
      req.session.message = 'Invalid Admin'
      res.redirect('/admin')
    }
  },
  getAdminlogout: (req, res) => {
    req.session.admin = null
    return res.redirect('/admin')
  },

  getUsers: async (req, res) => {
    try {
      const register = await User.find()
      return res.render('admin/user/userdata', { register })
    } catch (err) {
      res.redirect('/admin/error')
    }
  },
  blockUser: async (req, res) => {

    try {
      const id = req.params.id
      const user = await User.findById(id)


      if (user.isBlocked) {

        try {
          await User.findOneAndUpdate({ _id: id }, {
            $set: {
              isBlocked: false
            }
          })
          return res.json({
            successStatus: true,
            redirect: '/admin/users'
          })
        } catch (err) {
          res.redirect('/admin/error')
          return res.json({
            successStatus: false
          })
        }
      } else {

        try {
          const find = await User.findOneAndUpdate({ _id: id }, {
            $set: {
              isBlocked: true
            }
          })

          return res.json({
            successStatus: true,
            redirect: '/admin/users'
          })
        } catch (err) {

          return res.json({
            successStatus: false
          })
        }
      }
    } catch (error) {
      res.redirect('/admin/error')
    }
  },

  getSalesDetails: async (req, res) => {
    try {
      const orders = await Orders.find({ $match: { cancelled: false, paymentVerified: true } }).sort({ createdAt: -1 })
        .populate('customerId')
      res.render('admin/sales-details', { orders })
    } catch (err) {
      res.redirect('/admin/error')
    }
  },


  salesReportPdf: async (req, res) => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('http://localhost:3000/admin/sale-details', {
      waitUntil: 'networkidle2'
    })
    await page.pdf({ path: 'sales-details.pdf', format: 'a4', landscape: true })

    await browser.close()
    res.download('sales-details.pdf', 'Sale Report.pdf')
  },
  salesReportExcel: async (req, res) => {
    try {
      const orders = await Orders.aggregate([
        {
          $unwind: '$items',
        },
        {
          $addFields: {
            currMonth: {
              $month: new Date(),
            },
            docMonth: {
              $month: '$createdAt',
            },
          },
        },
        {
          $match: {
            cancelled: false,
            paymentVerified: true,
            $expr: {
              $eq: ['$currMonth', '$docMonth'],
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'customerId',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  username: 1,
                  email: 1,
                },
              },
            ],
            as: 'customerId',
          },
        },
      ]);

      const fields = [
        {
          label: 'Customer Name',
          value: 'customerId.username',
        },
        {
          label: 'Email',
          value: 'customerId.email',
        },
        {
          label: 'Payment Method',
          value: 'paymentMethod',
        },
        {
          label: 'Product',
          value: 'items.productName',
        },
        {
          label: 'Color',
          value: 'items.color',
        },
        {
          label: 'Quantity',
          value: 'items.quantity',
        },
        {
          label: 'Ordered On',
          value: 'createdAt',
        },
      ];
      const transforms = [unwind({ paths: ['customerId'] })];
      const json2csvParser = new Parser({ fields, transforms });
      const csv = json2csvParser.parse(orders);
      fs.writeFileSync('data.csv', csv);
      res.download('data.csv', 'Sales Report.csv');
    } catch (error) {
      res.redirect('/admin/error')
    }
  },
  getAdminDashboard: async (req, res) => {
    try {
      const user = await User.find()
      res.render('/admin/home-dashboard', { user })
    } catch (error) {

    }
  }

}
