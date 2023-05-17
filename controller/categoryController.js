const Category = require('../models/category')
const asyncHandler = require('express-async-handler')

module.exports = {
    getCategories: asyncHandler(async (req, res) => {
        const category = await Category.find({ isDeleted: false })
        if (req.session.message) {
            const message = req.session.message
            req.session.message = ''
            return res.render('admin/categories', { message, category })
        } else {
            const message = req.session.message = ''
            return res.render('admin/categories', { message, category })
        }

    }),
    addCategory: asyncHandler(async (req, res) => {
        const categoryname = req.body.category.toUpperCase()
        const storecategory = new Category({
            categoryname: req.body.category.toUpperCase()
        })
        const category = await Category.find({ categoryname, isDeleted: false })
        if (category.length == 0) {
            try {
                await storecategory.save()
                return res.redirect('/admin/categories')
            } catch (error) {
                req.session.message = error.errors.categoryname.properties.message

                return res.redirect('/admin/categories')
            }
        } else {
            req.session.message = 'Category already exist'
            res.redirect('/admin/categories')
        }

    }),

    deleteCategory: asyncHandler(async (req, res) => {
        const id = req.params.id
        await Category.findOneAndUpdate({ _id: id }, {
            $set: {
                isDeleted: true
            }
        })
        return res.json({
            successStatus: true,
            redirect: '/admin/categories'
        })

    })
}