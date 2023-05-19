const Orders = require('../models/order')
const User = require('../models/user')


module.exports = {
    getOrders: async (req, res) => {
        const orders = await Orders.find().sort({ createdAt: -1 })
            .populate('customerId')
            .populate('items.productId')
        return res.render('admin/order', { orders })
    },

    cancelOrder: async (req, res) => {
        try {
            const id = req.body.id
            await Orders.findOneAndUpdate({ _id: id }, {
                $set: {
                    cancelled: true
                }
            })
            return res.json({
                successStatus: true

            })
        } catch (err) {
            res.render('404')
        }
    },
    changeStatus: async (req, res) => {

        const id = req.body.id
        const status = req.body.value
        await Orders.findOneAndUpdate({ _id: id },
            {
                $set: {
                    orderStatus: status
                }
            })
        return res.json({
            successStatus: true

        })
    },
    getOrderDetails: async (req, res) => {
        try {
            const orders = await Orders.aggregate([
                {
                    $unwind: '$items'
                },
                {
                    $match: {
                        cancelled: false,
                        paymentVerified: true
                    }
                },
                {
                    $group: {
                        _id: { $dayOfYear: '$createdAt' },
                        date: { $first: '$createdAt' },
                        totalSpent: { $sum: '$totalAmount' }
                    }
                },
                {
                    $sort: {
                        date: 1
                    }
                }

            ])
            res.json({ orders })
        } catch (err) {
            res.render('404')
        }
    },

    getOrderViewDetails: async (req, res) => {
        try {
            const user = await User.findById(req.session.user._id)
            const orders = await Orders.find({ customerId: req.session.user._id }).sort({ createdAt: -1 })
            res.render('/admin/view-details', { orders, user })
        } catch (err) {
            res.render('404')
        }
    }
}