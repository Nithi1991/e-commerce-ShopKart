const Orders = require('../models/order')

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
            console.log(err)
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
            console.log(err)
        }
    },
    // returnOrder: async (req, res) => {
    //     const { id } = req.body
    //     try {
    //         const order = await Orders.findOneAndUpdate({ _id: id }, { $set: { return: true, returnStatus: 'Requested' } })
    //         res.json({ successStatus: true })
    //     } catch (error) {
    //         console.log(error)
    //         res.json({ successStatus: false })
    //     }
    // },

    getOrderViewDetails: async (req, res) => {
        try {
            const user = await User.findById(req.session.user._id)
            const orders = await Orders.find({ customerId: req.session.user._id }).sort({ createdAt: -1 })
            res.render('/admin/view-details', { orders, user })
        } catch (err) {
            console.log(err)
        }
    }
}