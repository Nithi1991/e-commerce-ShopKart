const express = require('express')
const userrouter = require('./router/userRouter')
const adminrouter = require('./router/adminRouter')
const db = require('./db/db')
const session = require('express-session')
const path = require('path')
const { json } = require('express')
const MongoStore = require('connect-mongo')
require('dotenv').config()

const app = express();
app.use(function (req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

const sessionStorage = MongoStore.create({
  mongoUrl: process.env.URL,
  dbName: 'ShoppyZone',
  collectionName: 'storeSession'

})

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, "./public")));

app.set('view engine', 'ejs');

app.use('/uploads', express.static('uploads'))
const oneWeek = 1000 * 60 * 60 * 24 * 7
app.use(session({
  secret: "this is my secret code 123@#$^&*",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: oneWeek },
  store: sessionStorage
}))




app.use('/', userrouter)
app.use('/admin', adminrouter)
app.listen(3000, () => { console.log("server running at port 3000") })