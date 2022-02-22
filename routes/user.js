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
const fs = require('fs');

const paypal = require('paypal-rest-sdk');
const paypalSecret = process.env.paypalSecret

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AWxrFLBMp4bfeaziZpLwLqLOl3YQPtS48KdoXhy5YfhzA-QRG1aibfqYqakfKS9MjGQE-mLHm-r6q-I6',
  'client_secret': paypalSecret
});


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
    res.redirect('/login')
  }
}

let getcartcount = async (req, res, next) => {
  cartCount = null;
  if (req.session.user) {
    cartCount = await userhelper.getCartCount(req.session.userId)
  }
  next()
}

let wishlistcount = async (req, res, next) => {
  wishCount = null;
  if (req.session.user) {
    wishCount = await userhelper.wishlistCount(req.session.userId)
  }
  next()
}

const verifyOfferExpiry = async (req, res, next) => {
  await userhelper.verifyOfferExpiry()
  next()
}


/* GET home page. */
router.get('/', verifyOfferExpiry, verifyBlocked, getcartcount, wishlistcount, async function (req, res, next) {

  userhelper.getproducts('Allproducts').then((products) => {

    adminhelper.getbanners().then((banners) => {
      Slider01 = banners[0]
      Slider02 = banners[1]
      Slider03 = banners[2]
      Banner01 = banners[3]
      Banner02 = banners[4]
      Banner03 = banners[5]

      res.render('User/index', { 'user': true, 'username': req.session.username, 'loggined': req.session.user, 'cartCount': cartCount, products, Slider01, Slider02, Slider03, Banner01, Banner02, Banner03, 'wishlistCount': wishCount })

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
      if (req.files) {
        let profilepic = req.files.profilepic
        profilepic.mv('./public/temp-userProfilePics/propic.jpg')
      } else {
        fs.copyFile('./public/images/profilepic.png', './public/temp-userProfilePics/propic.jpg', (err) => {
          if (err) throw err;
          console.log('source.txt was copied to destination.txt');
        });
      }
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
      req.session.useractiveMobile = `+91${response.mobile}`
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
  userhelper.getUserdetails(No).then((user) => {
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

            req.session.useractiveMobile = `+91${req.session.signupdetails.mobile}`

            req.session.user = true

            var oldPath = './public/temp-userProfilePics/propic.jpg'
            var newPath = './public/User-Profile-Pics/' + response.insertedId + '.jpg'

            fs.rename(oldPath, newPath, function (err) {
              if (err) throw err
            })

          })

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

router.get('/productdetails/', getcartcount, wishlistcount, async function (req, res, next) {

  if (req.query.id) {
    req.session.productDetailId = req.query.id
    let product = await producthelper.getoneproduct(req.query.id)

    res.render('User/product-detail', { 'user': true, product, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'wishlistCount': wishCount })
  } else if (req.session.user) {
    let product = await producthelper.getoneproduct(req.session.productDetailId)

    res.render('User/product-detail', { 'user': true, product, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'wishlistCount': wishCount })
  } else {
    res.redirect('/')
  }
});


router.get('/showallproducts/', getcartcount, wishlistcount, async function (req, res, next) {

  let products;
  let category;
  if(req.query.category){
    category = req.query.category
  }else{
    category = 'Allproducts'
  }

  if (req.session.priceFilter) {
    products = await userhelper.priceFilter(req.session.priceFilter.first, req.session.priceFilter.last)
 
  } else if (req.session.brandFilter) {
    products = await userhelper.brandFilter(req.session.brandFilter.value)
  }else if(req.session.sortProduct){
    products = await userhelper.sortProducts(req.session.sortProduct.value)
  }else {
    products = await userhelper.getproducts(category)

  }


  if (products.length === 0) {
    req.session.noproducts = true
  }
  res.render('User/products', { 'user': true, products, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'noProducts': req.session.noproducts, 'wishlistCount': wishCount })
  req.session.noproducts = false
  req.session.priceFilter = null
  req.session.brandFilter = null
  req.session.sortProduct = null

}); 

router.get('/cart', verifyBlocked, verifyLogin, getcartcount, wishlistcount, async function (req, res, next) {

  userhelper.getCartProducts(req.session.userId).then((products) => {
    req.session.couponapplied = null
    let total = 0
    for (let element of products) {
      if (element.product.discountDetails) {
        element.subtotal = element.product.discountDetails.subtotal
      }
      total = total + element.subtotal
    }



    grandtotal = total + 80



    if (cartCount === 0) {
      req.session.noCartProducts = true
    }
    res.render('User/cart', { user: true, products, 'total': total, 'grandtotal': grandtotal, 'wishlistCount': wishCount, 'userId': req.session.userId, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'noCartProducts': req.session.noCartProducts })
    req.session.noCartProducts = false

  })
});

router.get('/addToCart/:id/:quantity', function (req, res, next) {

  userhelper.addToCart(req.params.id, req.params.quantity, req.session.userId).then((response) => {
    if (response.productInCart) {
      res.json({ status: false })
    } else {
      res.json({ status: true })
    }
  })
});

router.post('/changeCartQuantity', function (req, res, next) {
  userhelper.changeCartQuantity(req.body).then(async (response) => {
    subtotal = await userhelper.getCartProducts(req.session.userId)
    console.log(subtotal);
    let subTotalCart
    let total = 0
    for (let element of subtotal) {
      if (element.product.discountDetails) {
        element.subtotal = element.product.discountDetails.subtotal
      }
      total = total + element.subtotal
      if (element.item == req.body.product) {
        subTotalCart = element.subtotal
      }
    }
    response.subtotal = subTotalCart
    response.total = total
    response.grandtotal = total + 80
    res.json(response)
  })
});
router.post('/removeCartProduct', function (req, res, next) {
  console.log(req.body);
  userhelper.removeCartProduct(req.body).then((response) => {
    res.json({ status: true })
  })
});
router.get('/checkout', verifyBlocked, verifyLogin, getcartcount, wishlistcount, async function (req, res, next) {
  let coupons = await userhelper.getAllCoupons(req.session.userId)
  userhelper.getaddress(req.session.userId).then((address) => {

    if (req.session.buynow) {
      discount = 0, couponcode = null;
      producthelper.getoneproduct(req.session.buynow).then((product) => {
        if (product.discountDetails) {
          subtotal = parseInt(product.discountDetails.currentprice)
        } else {
          subtotal = parseInt(product.price)
        }

        total = subtotal
        if (req.session.couponapplied) {

          couponcode = req.session.couponapplied.couponcode
          discount = (total + 80) * parseInt(req.session.couponapplied.discount) / 100
          grandtotal = (total + 80) - discount
        } else {
          grandtotal = total + 80
        }

        res.render('User/checkout', { user: true, address, coupons, 'wishlistCount': wishCount, 'subtotal': total, 'total': grandtotal, 'userId': req.session.userId, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'discount': discount, 'couponcode': couponcode })



      })
    } else {
      discount = 0, couponcode = null;

      userhelper.getCartProducts(req.session.userId).then((products) => {
        let total = 0
        for (let element of products) {
          if (element.product.discountDetails) {
            element.subtotal = element.product.discountDetails.subtotal
          }
          total = total + element.subtotal
        }
        if (req.session.couponapplied) {

          couponcode = req.session.couponapplied.couponcode
          discount = (total + 80) * parseInt(req.session.couponapplied.discount) / 100
          grandtotal = (total + 80) - discount
        } else {
          grandtotal = total + 80
        }
        res.render('User/checkout', { user: true, address, coupons, 'wishlistCount': wishCount, 'subtotal': total, 'total': grandtotal, 'userId': req.session.userId, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'discount': discount, 'couponcode': couponcode })


      })

    }

  })
});


router.post('/addAddress', function (req, res, next) {
  userhelper.addAddress(req.session.userId, req.body).then((response) => {
    if (req.body.page === 'profile') {
      res.redirect('userprofile')
    } else {

      res.redirect('/checkout')
    }
  })
});

router.post('/placeorder', verifyBlocked, verifyLogin, async function (req, res, next) {
  if (req.session.buynow) {
    products = await producthelper.getoneproduct(req.session.buynow)
    type = 'buynow';
  } else {
    products = await userhelper.orderPlacedProducts(req.session.userId)
    type = 'cart';
  }
  if (req.body.paymentmethod === 'COD') {
    userhelper.placeorder(req.body, products, type).then(async (response) => {
      req.session.orderId = response.insertedId
      if (req.session.couponapplied) {
        await userhelper.addAppliedCoupons(req.session.userId, req.session.couponapplied.couponcode)
        req.session.couponapplied = null
      }
      res.json({ codSuccess: true })
    })
  } else if (req.body.paymentmethod === 'razorpay') {
    req.session.orderDetails = { details: req.body, products: products, type: type }

    userhelper.generateRazorpay(req.body.total).then((response) => {
      response.razorpay = true
      res.json(response)
    })
  } else {

    req.session.orderDetails = { details: req.body, products: products, type: type };
    const create_payment_json = {
      "intent": "sale",
      "payer": {
        "payment_method": "paypal"
      },
      "redirect_urls": {
        "return_url": "http://localhost:3000/successpage?method=paypal",
        "cancel_url": "http://localhost:3000/checkout"
      },
      "transactions": [{
        "item_list": {
          "items": [{
            "name": products.product,
            "sku": "001",
            "price": parseInt(parseInt(req.body.total) / 75),
            "currency": "USD",
            "quantity": 1
          }]
        },
        "amount": {
          "currency": "USD",
          "total": parseInt(parseInt(req.body.total) / 75)
        },
        "description": "smartCart Product"
      }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {

        console.log(payment);
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === 'approval_url') {
            res.json(payment.links[i].href)
          }
        }

      }
    });
  }


});

router.get('/successpage/', verifyBlocked, verifyLogin, getcartcount, wishlistcount, async function (req, res, next) {
  if (req.query.method === 'paypal') {
    await userhelper.placeorder(req.session.orderDetails.details, req.session.orderDetails.products, req.session.orderDetails.type).then(async (response) => {
      req.session.orderId = response.insertedId
      req.session.orderDetails = null;
      if (req.session.couponapplied) {
        await userhelper.addAppliedCoupons(req.session.userId, req.session.couponapplied.couponcode)
        req.session.couponapplied = null
      }
    })
  }

  userhelper.getOrderDetails(req.session.orderId).then((order) => {
    res.render('User/success-page', { user: true, 'wishlistCount': wishCount, order, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount })
  })

});


router.get('/myorders', verifyBlocked, verifyLogin, getcartcount, wishlistcount, async function (req, res, next) {

  userhelper.myOrders(req.session.userId).then((orders) => {
    orders = orders.reverse()
    res.render('User/my-orders', { user: true, orders, 'wishlistCount': wishCount, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount })

  })
});

router.post('/viewOrderedProduct', verifyBlocked, verifyLogin, getcartcount, wishlistcount, async function (req, res, next) {


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
    res.render('User/ordered-product-details', { user: true, order, 'wishlistCount': wishCount, product, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, placed: placed, 'shipped': shipped, 'delivered': delivered })
    placed = false
    shipped = false
    delivered = false
  })


});

router.post('/search', getcartcount, wishlistcount, async function (req, res, next) {

  let nosearchresults = null;
  if (req.body.searchkey == "") {
    nosearchresults = true
  }

  userhelper.search(req.body.searchkey).then((searchedProducts) => {
    if (searchedProducts.length == 0) {
      nosearchresults = true
    }
    if (nosearchresults) {
      searchedProducts = null
    }
    res.render('User/products', { 'user': true, 'username': req.session.username, 'wishlistCount': wishCount, searchedProducts, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'nosearchresults': nosearchresults })
  })
});

router.get('/userprofile', verifyBlocked, verifyLogin, getcartcount, wishlistcount, function (req, res, next) {
  userhelper.getUser(req.session.userId).then((user) => {
    let useraddress = user.address
    res.render('User/user-profile', { user: true, 'username': req.session.username, 'wishlistCount': wishCount, 'loggined': req.session.user, user, useraddress, 'cartCount': cartCount })

  })
});

router.get('/removeaddress/', function (req, res, next) {

  userhelper.removeaddress(req.session.userId, req.query.value).then(() => {
    res.redirect("/userprofile")
  })
});

router.post('/updateuserdetails', function (req, res, next) {
  userhelper.updateuser(req.body).then(() => {
    req.session.useractiveMobile = `+91${req.body.mobile}`
    if (req.files) {
      let image = req.files.profilepic
      image.mv('./public/User-Profile-Pics/' + req.body.userId + '.jpg')
    }
    res.redirect('/userprofile')
  })
});

router.get('/changePassword', verifyBlocked, verifyLogin, getcartcount, wishlistcount, function (req, res, next) {
  res.render('User/change-password', { user: true, 'loggined': req.session.user, 'wishlistCount': wishCount, 'username': req.session.username, 'userId': req.session.userId, 'pwordNoMatch': req.session.pwordNoMatch, 'cartCount': cartCount })
});

router.post('/changePassword', function (req, res, next) {
  userhelper.changepassword(req.session.userId, req.body).then((response) => {
    if (response.pwordDoesNotMatch) {
      req.session.pwordNoMatch = true
      res.redirect('/changepassword')
    } else {

      res.redirect('/userprofile')
    }
  })
});

router.get('/buynow/', function (req, res, next) {
  req.session.buynow = req.query.id
  req.session.couponapplied = null
  res.redirect('/checkout')
});


router.post('/verifyPayment', function (req, res, next) {

  userhelper.verifyPayment(req.body).then(() => {
    userhelper.placeorder(req.session.orderDetails.details, req.session.orderDetails.products, req.session.orderDetails.type).then(async (response) => {
      req.session.orderId = response.insertedId
      req.session.orderDetails = null;
      if (req.session.couponapplied) {
        await userhelper.addAppliedCoupons(req.session.userId, req.session.couponapplied.couponcode)
        req.session.couponapplied = null
      }
      res.json({ paymentSuccess: true })
    })
  }).catch((err) => {
    console.log(err);

  })
});

router.get('/cancelorder/', function (req, res, next) {
  userhelper.cancelOrder(req.query.id).then(() => {
    res.redirect('/myorders')
  })

});


router.get('/wishlist', verifyLogin, verifyBlocked, getcartcount, wishlistcount, function (req, res, next) {

  userhelper.getWishlistProducts(req.session.userId).then((products) => {

    if (wishCount === 0) {
      req.session.noWishlistProducts = true
    }

    res.render('User/wishlist', { user: true, 'loggined': req.session.user, products, 'wishlistCount': wishCount, 'username': req.session.username, 'cartCount': cartCount, 'noWishlist': req.session.noWishlistProducts })
    req.session.noWishlistProducts = false
  })
});

router.get('/addtoWishlist/', function (req, res, next) {

  userhelper.addtoWishlist(req.query.id, req.session.userId).then((response) => {
    response.productInWishlist
    response.status = true
    res.json(response)
  })
});


router.get('/removefromWishlist/', function (req, res, next) {

  userhelper.removefromWishlist(req.query.id, req.session.userId).then(() => {
    res.redirect('/wishlist')
  })
});

router.get('/applyCoupon/:discount/:couponcode', function (req, res, next) {
  req.session.couponapplied = { couponcode: req.params.couponcode, discount: req.params.discount }
  res.redirect('/checkout')
});


router.get('/removecoupon', function (req, res, next) {
  req.session.couponapplied = null
  res.redirect('/checkout')
});


router.get('/filter/', function (req, res, next) {
  if (req.query.type === 'price') {
    req.session.priceFilter = { first: req.query.first, last: req.query.last }
    res.redirect('showallproducts')
  } else if(req.query.type === 'brand') {
    req.session.brandFilter = { value: req.query.value }
    res.redirect('showallproducts')
  }else{
    req.session.sortProduct = { value: req.query.value }
    res.redirect('showallproducts')
  }
});
module.exports = router;
