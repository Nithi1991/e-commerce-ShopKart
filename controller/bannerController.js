const Banner = require('../models/banner')
const path = require('path')


module.exports = {
    getBannersPage: async (req, res) => {
        try {
            const banners = await Banner.find()
            let message = ''
            if (req.session.message) {
                message = req.session.message
                req.session.message = null
            }
            res.render('admin/banner', { banners, message })
        } catch (error) {
            console.log(error)
        }
    },
    saveBanner: async (req, res) => {
        try {
            const { name, caption, link } = req.body
            if (!name) {
                req.session.message = 'Name cannot be empty'
                return res.redirect('/admin/banner')
            } else if (!req.file) {
                req.session.message = 'Image file is required'
                return res.redirect('/admin/banner')
            }
            const paths = req.file.path.slice(7).replace(new RegExp('\\' + path.sep, 'g'), '/')
            const banner = new Banner({
                name,
                caption,
                image: paths,
                link
            })
            await banner.save()
            res.redirect('/admin/banner')
        } catch (error) {
            res.redirect('/admin/error')
        }
    },
    setCurrentBanner: async (req, res) => {
        try {
            await Banner.updateMany({ setCurrent: true }, { $set: { setCurrent: false } })
            await Banner.findOneAndUpdate({ _id: req.body.bannerId }, { $set: { setCurrent: true } })
            res.json({ successStatus: true })
        } catch (error) {

            res.json({ successStatus: false })
        }
    },

    deleteBanner: async (req, res) => {
        try {
            await Banner.findOneAndUpdate({ _id: req.params.id }, { $set: { isDeleted: true } })
            res.json({ successStatus: true })
        } catch (error) {

            res.json({ successStatus: false })
        }
    }
}