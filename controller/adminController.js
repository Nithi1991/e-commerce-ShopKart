
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

    return res.render('admin/home-dashboard')
  },
  redirectAdminhome: async (req, res) => {
    const admin = await Adminregister.find({ adminname: req.body.adminname })
    if (admin.length != 0) {
      if (admin[0].adminpassword != req.body.adminpassword) {
        console.log(req.body.adminpassword)
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
      console.log(err)
    }
  },
  blockUser: async (req, res) => {

    try {
      const id = req.params.id
      const user = await User.findById(id)
      console.log(user)

      if (user.isBlocked) {
        console.log('blocked')
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
          console.log(err)
          return res.json({
            successStatus: false
          })
        }
      } else {
        console.log('not blocked')
        try {
          const find = await User.findOneAndUpdate({ _id: id }, {
            $set: {
              isBlocked: true
            }
          })
          console.log(find)
          console.log('done')
          return res.json({
            successStatus: true,
            redirect: '/admin/users'
          })
        } catch (err) {
          console.log(err)
          return res.json({
            successStatus: false
          })
        }
      }
    } catch (error) {
      console.log(error)
    }
  },

  getSalesDetails: async (req, res) => {
    try {
      const orders = await Orders.find({ $match: { cancelled: false, paymentVerified: true } }).sort({ createdAt: -1 })
        .populate('customerId')

      console.log('puppeteer orders')
      res.render('admin/sales-details', { orders })
    } catch (err) {
      console.log(err)
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
      console.log(orders);
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
      console.log(error);
    }
  },
  getDateFilter: async (req, res) => {
    // Get the date query parameter from the request
    const date = req.query.date; // Assuming the query parameter is 'date'

    // Filter the orders based on the provided date
    const filteredOrders = await orders.filter(order => {
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');
      return orderDate === date;
    });

    res.render('sales-report', { orders: filteredOrders });
  }

}
