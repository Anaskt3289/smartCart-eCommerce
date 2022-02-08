var express = require('express');
const { response } = require('../app');
var router = express.Router();
const userhelper = require('../Helpers/userHelper')
const producthelper = require('../Helpers/productHelper')
const adminhelper = require('../Helpers/adminHelper')
const { Client } = require('twilio/lib/twiml/VoiceResponse');
const serviceSID = process.env.serviceSID
const accountSID = process.env.accountSID
const authTocken = process.env.authTocken
const req = require('express/lib/request');
const async = require('hbs/lib/async');
const { ObjectId } = require('mongodb');
const client = require('twilio')(accountSID, authTocken)
const fs=require('fs')

const verifyBlocked = async (req, res, next) => {
  if (req.session.useractiveMobile) {
    let userblocked = await userhelper.getdata(req.session.useractiveMobile)
    if (userblocked) {
      if (userblocked.blocked) {
        req.session.user = false
      } else {
        req.session.username = userblocked.fname
        req.session.userId = userblocked._id
      }
    } else {
      req.session.user = false
    }
  }
  next()
}

const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/')
  }
}

/* GET home page. */
router.get('/', verifyBlocked, async function (req, res, next) {
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userhelper.getCartCount(req.session.userId)
  }
  userhelper.getproducts().then((products) => {
    adminhelper.getbanners().then((banners)=>{
      Slider01=banners[0]
      Slider02=banners[1]
      Slider03=banners[2]
      Banner01=banners[3]
      Banner02=banners[4]
      Banner03=banners[5]

      res.render('User/index', { 'user': true, 'username': req.session.username, 'loggined': req.session.user, 'cartCount': cartCount,banners,Slider01, Slider02, Slider03, Banner01, Banner02, Banner03 })
     
    })
  })
});

router.get('/login', function (req, res, next) {
  if (req.session.user == true) {
    res.redirect('/')
  } else {
    res.render('User/login', { 'logerr': req.session.userlogerr, 'blocked': req.session.blocked });
    req.session.userlogerr = false;
    req.session.blocked = false;

  }

});

router.get('/signup', function (req, res, next) {
  if (req.session.user == true) {
    res.redirect('/login')
  } else {
    res.render('User/signup', { 'registereduser': req.session.userfound });
    req.session.userfound = false
  }
});

router.post('/signup', function (req, res, next) {
  let No = req.body.mobile
  let Mobile = `+91${No}`
  userhelper.getUserdetails(Mobile, req.body.email).then((user) => {
    if (user) {
      req.session.userfound = true
      res.redirect('/signup')
    } else {
      req.session.signupdetails = req.body
      let profilepic = req.files.profilepic
      profilepic.mv('./public/temp-userProfilePics/propic.jpg')
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${No}`,
          channel: "sms"
        }).then((resp) => {
          req.session.number = resp.to
          res.redirect('/otp');
        }).catch((err) => {
          console.log(err);
        })
    }
  })
});

router.post('/login', function (req, res, next) {
  userhelper.userlogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = true;
      req.session.useractiveMobile = response.mobile
      req.session.username = response.user;
      res.redirect('/login')
    } else {
      if (response.blocked) {
        req.session.blocked = true;
        res.redirect('/login')
      } else {
        req.session.userlogerr = true;
        res.redirect('/login')
      }
    }
  })
});
router.get('/otplogin', (req, res) => {
  res.render('User/otp-login', { 'noMobile': req.session.mobilenotregistered })
  req.session.mobilenotregistered = false
})


router.post('/otplogin', (req, res) => {
  let No = req.body.mobile
  let Mobile = `+91${No}`
  userhelper.getUserdetails(Mobile).then((user) => {
    if (user) {
      req.session.otplogin = true
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${No}`,
          channel: "sms"
        }).then((resp) => {
          req.session.number = resp.to
          res.redirect('/otp');
        }).catch((err) => {
          console.log(err);
        })
    } else {
      req.session.mobilenotregistered = true
      res.redirect('/otplogin')
    }
  })
})
router.get('/resendotp', (req, res) => {
  req.session.otplogin = true
  client.verify
    .services(serviceSID)
    .verifications.create({
      to: req.session.number,
      channel: "sms"
    }).then((resp) => {
      res.redirect('/otp');
    }).catch((err) => {
      console.log(err);
    })
})
router.get('/otp', (req, res) => {

  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('User/otp-verification', { 'invalidOtp': req.session.inavlidloginOtp })
    req.session.invalidOtp = false
  }
})
router.post('/otp', (req, res) => {
  let otp = req.body.otp
  let number = req.session.number
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: number,
      code: otp
    }).then(async (resp) => {
      if (resp.valid) {
        if (req.session.otplogin) {
          req.session.useractiveMobile = req.session.number
          req.session.user = true
          req.session.otplogin = false
        } else {
          userhelper.adduserdetails(req.session.signupdetails).then((response) => {

           
            var oldPath = './public/temp-userProfilePics/propic.jpg'
            var newPath = './public/User-Profile-Pics/' + response.insertedId + '.jpg'

            fs.rename(oldPath, newPath, function (err) {
              if (err) throw err
              console.log('Successfully renamed - AKA moved!')
            })
          })

          req.session.useractiveMobile = req.session.signupdetails.mobile
          req.session.user = true
        }
        res.redirect('/')
      } else {
        req.session.inavlidloginOtp = true
        res.redirect('/otp')
      }
    }).catch((err) => {
      req.session.inavlidloginOtp = true
      res.redirect('/otp')
    })
})

router.get('/userlogout', async function (req, res, next) {
  req.session.user = false;
  res.redirect('/login')
});

router.get('/productdetails/', async function (req, res, next) {
  let cartCount = null
  if (req.session.user) {
    cartCount = await userhelper.getCartCount(req.session.userId)
  }
  if (req.query.id) {
    req.session.productDetailId = req.query.id
    let product = await producthelper.getoneproduct(req.query.id)
    res.render('User/product-detail', { 'user': true, product, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount })
  } else if (req.session.user) {
    let product = await producthelper.getoneproduct(req.session.productDetailId)
    res.render('User/product-detail', { 'user': true, product, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount })
  } else {
    res.redirect('/')
  }
});
router.get('/home', function (req, res, next) {
  res.redirect('/')

});

router.get('/showallproducts/', async function (req, res, next) {
 
  let cartCount = null
  if (req.session.user) {
    cartCount = await userhelper.getCartCount(req.session.userId)
    
  }
  userhelper.getproducts(req.query.category).then((products) => {
    res.render('User/products', { 'user': true, products, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount })
  })
});

router.get('/cart', verifyLogin, async function (req, res, next) {
  let cartCount = await userhelper.getCartCount(req.session.userId)
  userhelper.getCartProducts(req.session.userId).then((products) => {
    userhelper.getCartTotal(req.session.userId).then((subtotal) => {
      let total = 0
      for (let element of subtotal) {
        total = total + element.subtotal
      }
      grandTotal = total + 80
      res.render('User/cart', { user: true, products, 'total': total, 'grandTotal': grandTotal, 'userId': req.session.userId, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount })
    })
  })
});

router.get('/addToCart/', function (req, res, next) {
  userhelper.addToCart(req.query.id, req.session.userId).then((response) => {
    if (response.productInCart) {
      res.json({ status: false })
    } else {
      res.json({ status: true })
    }
  })
});

router.post('/changeCartQuantity', function (req, res, next) {
  userhelper.changeCartQuantity(req.body).then(async (response) => {
    subtotal = await userhelper.getCartTotal(req.session.userId)
    let total = 0
    for (let element of subtotal) {
      total = total + element.subtotal
      if (element.item == req.body.product) {
        subTotalCart = element.subtotal
      }
    }
    response.subtotal = subTotalCart
    response.total = total
    response.grandtotal = total + 80
    console.log(response);
    res.json(response)
  })
});
router.post('/removeCartProduct', function (req, res, next) {
  console.log(req.body);
  userhelper.removeCartProduct(req.body).then((response) => {
    res.json({ status: true })
  })
});
router.get('/checkout', verifyLogin, async function (req, res, next) {
  let cartCount = await userhelper.getCartCount(req.session.userId)
  userhelper.getaddress(req.session.userId).then((address) => {
    userhelper.getCartTotal(req.session.userId).then((subtotal) => {
      let total = 0
      for (let element of subtotal) {
        total = total + element.subtotal
      }
      grandtotal = total + 80
      res.render('User/checkout', { user: true, address, 'subtotal': total, 'total': grandtotal, 'userId': req.session.userId, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount })
    })
  })
});


router.post('/addAddress', function (req, res, next) {
  userhelper.addAddress(req.session.userId, req.body).then((response) => {
    res.redirect('/checkout')
  })
});

router.post('/placeorder', verifyLogin, async function (req, res, next) {
  let products = await userhelper.orderPlacedProducts(req.session.userId)
  userhelper.placeorder(req.body, products).then((response) => {
    req.session.orderId = response.insertedId
    res.json({ status: true })

  })
});

router.get('/successpage', verifyLogin, async function (req, res, next) {
  let cartCount = await userhelper.getCartCount(req.session.userId)
  userhelper.getOrderDetails(req.session.orderId).then((order) => {
    res.render('User/success-page', { user: true, order, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount })
  })
});
router.get('/myorders', verifyLogin, async function (req, res, next) {
  let cartCount = await userhelper.getCartCount(req.session.userId)
  userhelper.myOrders(req.session.userId).then((orders) => {
    orders = orders.reverse()
    res.render('User/my-orders', { user: true, orders, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount })

  })
});

router.post('/viewOrderedProduct', verifyLogin, async function (req, res, next) {
  let cartCount = await userhelper.getCartCount(req.session.userId)

  userhelper.getOrderDetails(req.body.orderId).then((order) => {
    let product = null
    for (let element of order[0].product) {
      if (element._id == req.body.productId) {
        product = element
      }
    }
    let placed = false
    let shipped = false
    let delivered = false
    console.log(order[0].status);
    if ((order[0].status) == 'Order Placed') {
      placed = true
    } else if (order[0].status === 'Shipped') {
      shipped = true
    } else {
      delivered = true
    }
    console.log(placed, shipped, delivered);
    res.render('User/ordered-product-details', { user: true, order, product, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, placed: placed, 'shipped': shipped, 'delivered': delivered })
    placed = false
    shipped = false
    delivered = false
  })


});

router.post('/search', async function (req, res, next) {
  let cartCount = null;
  let nosearchresults = null;
  if (req.body.searchkey == "") {
    nosearchresults = true
  }
  if (req.session.user) {
    cartCount = await userhelper.getCartCount(req.session.userId)
  }
  userhelper.search(req.body.searchkey).then((searchedProducts) => {
    if (searchedProducts.length == 0) {
      nosearchresults = true
    }
    if (nosearchresults) {
      searchedProducts = null
    }
    res.render('User/products', { 'user': true, searchedProducts, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'nosearchresults': nosearchresults })
  })
});
module.exports = router;