const mongoose = require('mongoose')


const CouponSchema = new mongoose.Schema({
    coupon: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    isPercentage: {
        type: Boolean,
        default: true
    },
    minPurchase: {
        type: Number,
        required: true,
    },
    maxDiscount: {
        type: Number,
        required: true,
    },
    expiry: {
        type: Date,
        required: true,

    },
    discount: {
        type: Number,

    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]

})
const Coupons = mongoose.model('Coupons', CouponSchema)
module.exports = Coupons
