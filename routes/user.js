var express = require('express');
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


//paypal configuration using secret key
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AWxrFLBMp4bfeaziZpLwLqLOl3YQPtS48KdoXhy5YfhzA-QRG1aibfqYqakfKS9MjGQE-mLHm-r6q-I6',
  'client_secret': paypalSecret
});

//function to verify the user is blocked or deleted
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

//function to verify the user is logged in or not
const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}

//function to get the cart count
let getcartcount = async (req, res, next) => {
  cartCount = null;
  if (req.session.user) {
    cartCount = await userhelper.getCartCount(req.session.userId)
  }
  next()
}

//function to get the wishlist count
let wishlistcount = async (req, res, next) => {
  wishCount = null;
  if (req.session.user) {
    wishCount = await userhelper.wishlistCount(req.session.userId)
  }
  next()
}

//function to get the verify the offer is expired or not
const verifyOfferExpiry = async (req, res, next) => {
  await userhelper.verifyOfferExpiry()
  next()
}


/* GET home page. */
router.get('/', verifyOfferExpiry, verifyBlocked, getcartcount, wishlistcount, async function (req, res, next) {
if(req.session.pagination){
    products = await userhelper.getHomeProducts(req.session.paginateCount)
}else{
    products = await userhelper.getHomeProducts(1)
    req.session.paginateCount=null
  }

    if (req.session.user) {
      for (let element of products) {
        element.loggined = true
      }

    }
   let banners = await adminhelper.getbanners()
      Slider01 = banners[0]
      Slider02 = banners[1]
      Slider03 = banners[2]
      Banner01 = banners[3]
      Banner02 = banners[4]
      Banner03 = banners[5]

      res.render('User/index', { 'user': true, 'username': req.session.username, 'loggined': req.session.user, 'cartCount': cartCount, products, Slider01, Slider02, Slider03, Banner01, Banner02, Banner03, 'wishlistCount': wishCount })

      req.session.pagination = false
});

//user login page
router.get('/login', function (req, res, next) {
  if (req.session.user == true) {
    res.redirect('/')
  } else {
    res.render('User/login', { 'logerr': req.session.userlogerr, 'blocked': req.session.blocked });
    req.session.userlogerr = false;
    req.session.blocked = false;

  }
});


//user signup
router.get('/signup', function (req, res, next) {
  if (req.session.user == true) {
    res.redirect('/login')
  } else {
    res.render('User/signup', { 'registereduser': req.session.userfound });
    req.session.userfound = false
  }
});

//user signup submission
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

//user login submission
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

//login page to login with otp
router.get('/otplogin', (req, res) => {
  res.render('User/otp-login', { 'noMobile': req.session.mobilenotregistered })
  req.session.mobilenotregistered = false
})

//login with otp submission
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

//resend otp
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

//otp get
router.get('/otp', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('User/otp-verification', { 'invalidOtp': req.session.inavlidloginOtp })
    req.session.inavlidloginOtp = false
  }
})

//otp validate 
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
          await userhelper.adduserdetails(req.session.signupdetails).then((response) => {

            req.session.useractiveMobile = req.session.number
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


//user logout
router.get('/userlogout', async function (req, res, next) {
  req.session.user = false;
  res.redirect('/login')
});


//product details page
router.get('/productdetails/', getcartcount, wishlistcount, async function (req, res, next) {
  let reviews = await userhelper.getReviews()
  let users = await adminhelper.getusers()
  let userReviews = []
  for (let review of reviews) {
    for (let user of users) {
      if (review.productid === req.query.id || review.productid === req.session.productDetailId) {
        if (review.userid + "" === user._id + "") {
          userReviews.push({ review: review.review, user: user.fname, userid: review.userid })
        }

      }
    }
  }
  let reviewCount = userReviews.length

  if (req.query.id) {
    req.session.productDetailId = req.query.id
    let product = await producthelper.getoneproduct(req.query.id)

    res.render('User/product-detail', { 'user': true, product, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'wishlistCount': wishCount, userReviews, 'reviewCount': reviewCount })
  } else if (req.session.user) {
    let product = await producthelper.getoneproduct(req.session.productDetailId)
    console.log(userReviews);
    res.render('User/product-detail', { 'user': true, product, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'wishlistCount': wishCount, userReviews, 'reviewCount': reviewCount })
  } else {
    res.redirect('/')
  }
});

//shop page which shows all products
router.get('/showallproducts/', getcartcount, wishlistcount, async function (req, res, next) {

  let products;

  let category;
  let categoryBrandDetails = await adminhelper.getCategoryBrandProducts()
  let brands = categoryBrandDetails.brand
  let categories = categoryBrandDetails.category
  if (req.query.category) {
    category = req.query.category
  } else {
    category = 'Allproducts'
  }
  if (req.session.searchkey) {
    products = await userhelper.search(req.session.searchkey)
  } else if (req.session.filtersort) {
    products = await userhelper.sortProducts(req.session.filtersort)
  } else {
    products = await userhelper.getproducts(category)
  }



  let pricerangefilter = []
  let brandfilter = []
  let categoryfilter = []

  if (req.session.filterpricerange) {
    let start = 0, end = 0
    switch (req.session.filterpricerange) {
      case 'below5000': start = 0, end = 5000

        break;

      case '5000-10000': start = 5000, end = 10000

        break;

      case '10000-20000': start = 10000, end = 20000

        break;
      case '20000-30000': start = 20000, end = 30000

        break;
      case '30000-50000': start = 30000, end = 50000

        break;
      case 'above50000': start = 50000, end = 50000000000

        break;

      default: start = 0, end = 0
        break;
    }

    for (let element of products) {
      if (parseInt(element.price) >= start && parseInt(element.price) <= end) {
        pricerangefilter.push(element)
      }
    }
  } else {
    pricerangefilter = products
  }


  if (req.session.filterbrand) {
    console.log(req.session.filterbrand);
    for (let element of pricerangefilter) {
      console.log(element.brand);
      if (element.brand === req.session.filterbrand) {
        brandfilter.push(element)
      }
    }
  } else {
    brandfilter = pricerangefilter
  }

  if (req.session.filtercategory) {
    console.log(req.session.filtercategory);
    for (let element of brandfilter) {
      console.log(element.category);
      if (element.category === req.session.filtercategory) {
        categoryfilter.push(element)
      }
    }
  } else {
    categoryfilter = brandfilter
  }




  if (categoryfilter.length === 0) {
    req.session.noproducts = true
  }
  res.render('User/products', { 'user': true, categoryfilter, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'noProducts': req.session.noproducts, 'wishlistCount': wishCount, brands, categories })
  req.session.noproducts = false
  req.session.searchkey = null
  req.session.filterpricerange = null
  req.session.filterbrand = null
  req.session.filtercategory = null
});


//cart page
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
      var noCartProducts = true
    }else{
      var cartHasProducts = true
    }
    res.render('User/cart', { user: true, products, 'total': total, 'grandtotal': grandtotal, 'wishlistCount': wishCount, 'userId': req.session.userId, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'noCartProducts':noCartProducts,'cartHasProducts':cartHasProducts })
    req.session.noCartProducts = false

  })
});


//add products to cart
router.get('/addToCart/:id/:quantity', verifyBlocked, verifyLogin, function (req, res, next) {

  userhelper.addToCart(req.params.id, req.params.quantity, req.session.userId).then((response) => {
    if (response.productInCart) {
      res.json({ status: false })
    } else {
      res.json({ status: true })
    }
  })
});


//change quantity of the products in cart
router.post('/changeCartQuantity',verifyBlocked, verifyLogin, function (req, res, next) {
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

//remove cart product
router.get('/removeCartProduct/',verifyBlocked, verifyLogin, function (req, res, next) {

  userhelper.removeCartProduct(req.session.userId,req.query.id).then((response) => {
    res.redirect('/cart')
  })
});

//checkout page
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

          couponcode = req.session.couponapplied
          for (let coupon of coupons) {
            if (coupon.couponcode === couponcode) {
              coupondiscount = coupon.discount
            }
          }
          discount = (total + 80) * parseInt(coupondiscount) / 100
          grandtotal = (total + 80) - discount
          req.session.grandtotal = grandtotal
        } else {
          grandtotal = total + 80
          req.session.grandtotal = grandtotal
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

          couponcode = req.session.couponapplied
          for (let coupon of coupons) {
            if (coupon.couponcode === couponcode) {
              coupondiscount = coupon.discount
            }
          }

          discount = (total + 80) * parseInt(coupondiscount) / 100
          grandtotal = (total + 80) - discount
          req.session.grandtotal = grandtotal
        } else {
          grandtotal = total + 80
          req.session.grandtotal = grandtotal
        }
        res.render('User/checkout', { user: true, address, coupons, 'wishlistCount': wishCount, 'subtotal': total, 'total': grandtotal, 'userId': req.session.userId, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount, 'discount': discount, 'couponcode': couponcode })
      })
    }
  })
});

//add address of the user
router.post('/addAddress',verifyBlocked, verifyLogin, function (req, res, next) {
  userhelper.addAddress(req.session.userId, req.body).then((response) => {
    if (req.body.page === 'profile') {
      res.redirect('userprofile')
    } else {

      res.redirect('/checkout')
    }
  })
});


//place order submission
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
    userhelper.generateRazorpay(req.session.grandtotal).then((response) => {
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
            "price": parseInt(parseInt(req.session.grandtotal) / 75),
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


//success page after order is placed
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


//my orders page
router.get('/myorders', verifyBlocked, verifyLogin, getcartcount, wishlistcount, async function (req, res, next) {
  let noUserOrders
  userhelper.myOrders(req.session.userId).then((orders) => {
    orders = orders.reverse()
    for (let element of orders) {
      if (element.status === 'Delivered') {
        element.delivered = true
      }
    }
    if(orders.length===0){
      noUserOrders = true
    }
    res.render('User/my-orders', { user: true, orders, 'wishlistCount': wishCount, 'loggined': req.session.user, 'username': req.session.username, 'cartCount': cartCount ,'noUserOrders':noUserOrders})
  })
});


//detail page of ordered products
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


//search products
router.post('/search', getcartcount, wishlistcount, async function (req, res, next) {
  if (req.body.searchkey) {

    if (req.body.searchkey == "") {
      req.session.noSearchresults = true
    } else {
      req.session.searchkey = req.body.searchkey
    }
  }
  res.redirect('/showallproducts/')
});


//user profile page
router.get('/userprofile', verifyBlocked, verifyLogin, getcartcount, wishlistcount, function (req, res, next) {
  userhelper.getUser(req.session.userId).then((user) => {
    let useraddress = user.address
    res.render('User/user-profile', { user: true, 'username': req.session.username, 'wishlistCount': wishCount, 'loggined': req.session.user, user, useraddress, 'cartCount': cartCount })
  })
});


//remove address of the user
router.get('/removeaddress/',verifyBlocked, verifyLogin, function (req, res, next) {

  userhelper.removeaddress(req.session.userId, req.query.value).then(() => {
    res.redirect("/userprofile")
  })
});


//update the details of user
router.post('/updateuserdetails',verifyBlocked, verifyLogin, function (req, res, next) {

  userhelper.updateuser(req.body).then(() => {
    req.session.useractiveMobile = `+91${req.body.mobile}`
    if (req.files) {
      let image = req.files.profilepic
      image.mv('./public/User-Profile-Pics/' + req.body.userId + '.jpg')
    }
    res.redirect('/userprofile')
  })
});


//user can change existing password and create a new one
router.get('/changePassword', verifyBlocked, verifyLogin, getcartcount, wishlistcount, function (req, res, next) {
  res.render('User/change-password', { user: true, 'loggined': req.session.user, 'wishlistCount': wishCount, 'username': req.session.username, 'userId': req.session.userId, 'pwordNoMatch': req.session.pwordNoMatch, 'cartCount': cartCount })
});


//change password submission
router.post('/changePassword',verifyBlocked, verifyLogin, function (req, res, next) {
  userhelper.changepassword(req.session.userId, req.body).then((response) => {
    if (response.pwordDoesNotMatch) {
      req.session.pwordNoMatch = true
      res.redirect('/changepassword')
    } else {

      res.redirect('/userprofile')
    }
  })
});


//buy now option
router.get('/buynow/',verifyBlocked, verifyLogin, function (req, res, next) {
  req.session.buynow = req.query.id
  req.session.couponapplied = null
  res.redirect('/checkout')
});


//function to verify the payment through razorpay
router.post('/verifyPayment',verifyBlocked, verifyLogin, function (req, res, next) {
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


//cancel orders
router.get('/cancelorder/',verifyBlocked, verifyLogin, function (req, res, next) {
  userhelper.cancelOrder(req.query.id).then(() => {
    res.redirect('/myorders')
  })

});

//wislist page
router.get('/wishlist',verifyBlocked, verifyLogin, verifyLogin, verifyBlocked, getcartcount, wishlistcount, function (req, res, next) {

  userhelper.getWishlistProducts(req.session.userId).then((products) => {
    if (wishCount === 0) {
      req.session.noWishlistProducts = true
    }
    res.render('User/wishlist', { user: true, 'loggined': req.session.user, products, 'wishlistCount': wishCount, 'username': req.session.username, 'cartCount': cartCount, 'noWishlist': req.session.noWishlistProducts })
    req.session.noWishlistProducts = false
  })
});


//add products to wishlist
router.get('/addtoWishlist/',verifyBlocked, verifyLogin, function (req, res, next) {
  userhelper.addtoWishlist(req.query.id, req.session.userId).then((response) => {
    response.productInWishlist
    response.status = true
    res.json(response)
  })
});

//remove products from wishlist using ajax in home and product page
router.get('/removefromWishlist/',verifyBlocked, verifyLogin, function (req, res, next) {
  userhelper.removefromWishlist(req.query.id, req.session.userId).then(() => {
    res.json({status:true})
  })
});

//remove products from wishlist in wishlist page
router.get('/removeproductfromWishlist/',verifyBlocked, verifyLogin, function (req, res, next) {
  userhelper.removefromWishlist(req.query.id, req.session.userId).then(() => {
    res.redirect('/wishlist')
  })
});


//apply coupons
router.get('/applyCoupon/:couponcode',verifyBlocked, verifyLogin, function (req, res, next) {
  req.session.couponapplied = req.params.couponcode
  res.redirect('/checkout')
});

//remove coupon applied
router.get('/removecoupon',verifyBlocked, verifyLogin, function (req, res, next) {
  req.session.couponapplied = null
  res.redirect('/checkout')
});

//page to write the review
router.get('/reviewpage/',verifyBlocked, verifyLogin, verifyLogin, verifyBlocked, getcartcount, wishlistcount, function (req, res, next) {
  productId = req.query.id
  res.render('User/review', { user: true, 'productId': productId, 'userid': req.session.userId })
});

//review submission
router.post('/submitReview',verifyBlocked, verifyLogin, function (req, res, next) {
  userhelper.submitreview(req.body).then(() => {
    res.redirect('/myorders')
  })
});


//apply filters
router.post('/applyFilter', function (req, res, next) {
  console.log(req.body);
  if (req.body) {
    req.session.Filter = true
    if (req.body.sort) {
      req.session.filtersort = req.body.sort
    }
    if (req.body.pricerange) {
      req.session.filterpricerange = req.body.pricerange
    }
    if (req.body.brand) {
      req.session.filterbrand = req.body.brand
    }
    if (req.body.category) {
      req.session.filtercategory = req.body.category
    }
  }
  res.redirect('/showallproducts')
});

//users home pagination (load more)
router.get('/paginateUserHome', function (req, res, next) {
  req.session.pagination = true
 if(req.session.paginateCount){
  req.session.paginateCount = req.session.paginateCount+1
 }else{
  req.session.paginateCount = 2
 }
 res.redirect('/')
});


module.exports = router;
