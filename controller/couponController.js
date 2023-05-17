const Coupons = require('../models/coupon')
const asyncHandler = require('express-async-handler')

module.exports = {
    getCoupon: asyncHandler(async (req, res) => {
        if (req.session.message) {
            const message = req.session.message
            req.session.message = ''
            const coupons = await Coupons.find({ isDeleted: false })
            return res.render('admin/coupons', { message, coupons })
        } else {
            const message = ''
            const coupons = await Coupons.find({ isDeleted: false })
            return res.render('admin/coupons', { message, coupons })
        }
    }),
    addCoupon: asyncHandler(async (req, res) => {
        const exist = await Coupons.find({ coupon: req.body.coupon })
        if (exist.length > 0) {
            req.session.message = 'Coupon already exist'
            return res.redirect('/admin/coupon')
        }

        const expiry = new Date(req.body.expiry + 'T23:59:59')
        const coupon = new Coupons({
            coupon: req.body.coupon,
            details: req.body.details,
            expiry,
            minPurchaseValue: req.body.minPurchaseValue,
            discount: req.body.discount

        })
        if (req.body.percentage) {
            coupon.isPercentage = true
        }
        await coupon.save()
        return res.redirect('/admin/coupon')
    }),
    deleteCoupon: asyncHandler(async (req, res) => {
        const id = req.params.id
        await Coupons.findOneAndUpdate({ _id: id }, {
            $set: {
                isDeleted: true
            }
        })
        return res.json({
            successStatus: true

        })

    }),
    editCoupon: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const coupon = await Coupons.findById(id);
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }

        // Update coupon properties
        coupon.coupon = req.body.coupon;
        coupon.details = req.body.details;
        coupon.expiry = req.body.expiry;
        coupon.discount = req.body.discount;
        coupon.minPurchaseValue = req.body.minPurchaseValue
        coupon.isPercentage = req.body.isPercentage;

        // Save updated coupon to database
        await coupon.save();
        return res.render('admin/coupon-edit', { coupon })

    })
}