const Products = require('../models/products')
const Category = require('../models/category')

module.exports = {
    getProducts: async (req, res) => {
        try {
            const products = await Products.find({ isDeleted: false }).populate('categoryId')
            return res.render('admin/product/product-details', { products })
        } catch (err) {
            console.log(err)
        }
    },
    getAddproducts: async (req, res) => {
        const category = await Category.find({ isDeleted: false })
        return res.render('admin/product/product-add', { category })
    },
    getEditproducts: async (req, res) => {
        const category = await Category.find()
        const products = await Products.findById(req.params.id)

        return res.render('admin/product/product-edit', { category, products })
    },
    addProducts: async (req, res) => {
        try {
            const images = []
            for (key in req.files) {
                const paths = req.files[key][0].path
                images.push(paths.slice(7))
            }
            const storeproducts = new Products({
                productname: req.body.productname,
                color: req.body.colour,
                size: req.body.size,
                price: req.body.price,
                offer: req.body.offer,
                description: req.body.description,
                totalStoke: req.body.totalstoke,

                categoryId: req.body.categoryId,
                images
            })
            try {
                await storeproducts.save()
                return res.redirect('/admin/products')
            } catch (error) {
                console.log(error)
                return res.redirect('/admin/products/addproducts')
            }
        } catch (err) {
            console.log(err)
        }
    },
    deleteProduct: async (req, res) => {
        try {
            const id = req.params.id
            await Products.findOneAndUpdate({ _id: id }, {
                $set: {
                    isDeleted: true
                }
            })
            return res.json({
                successStatus: true,
                redirect: '/admin/products'
            })
        } catch (err) {
            console.log(err)
        }
    },
    editProduct: async (req, res) => {
        try {
            const id = req.params.id
            const product = await Products.findById(id)
            const images = product.images
            if (req.files.image) {
                const paths = req.files.image[0].path
                images.splice(0, 1, paths.slice(7))
            }
            if (req.files.image2) {
                const paths = req.files.image2[0].path
                images.splice(1, 1, paths.slice(7))
            }
            if (req.files.image3) {
                const paths = req.files.image3[0].path
                images.splice(2, 1, paths.slice(7))
            }

            // const images =[];
            //     for(key in req.files){
            //         const paths = req.files[key][0].path

            //         images.push(paths.slice(7))
            //     }
            console.log(id)
            console.log(req.body)
            await Products.findByIdAndUpdate({ _id: id }, req.body)
            await Products.findByIdAndUpdate({ _id: id }, {
                images
            })
            return res.redirect('/admin/products')
        } catch (err) {
            console.log(err)
        }
    },
}