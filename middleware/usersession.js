/* eslint-disable eqeqeq */
const User = require('../models/user')

module.exports = {
  isLogged: async (req, res, next) => {

    if (req.session.user) {
      const user = await User.find({ _id: req.session.user._id })

      if (user[0].isBlocked == true) {

        req.session.user = null
        res.redirect('/login')
      } else {
        next()
      }
    } else {
      res.redirect('/login')
    }
  },
  notLogged: (req, res, next) => {
    if (!req.session.user) {
      next()
    } else {
      res.redirect('/home')
    }
  }
}
