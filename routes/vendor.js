var express = require('express');
var router = express.Router();
const vendorhelper = require('../Helpers/vendorHelper')
const producthelper = require('../Helpers/productHelper');
const adminhelper = require('../Helpers/adminHelper');
const userhelper = require('../Helpers/userHelper')


const { redirect } = require('express/lib/response');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const async = require('hbs/lib/async');


//verify the vendor is blocked , deleted 
const verifyBlocked = async (req, res, next) => {
  let vendor = await vendorhelper.getvendor(req.session.vendorId)
  if (vendor) {
    if (vendor.blocked) {
      req.session.vendor = false
    } else {
      req.session.vendorname = vendor.vname
      req.session.vendorId = vendor._id
    }
  } else {
    req.session.vendor = false
  }
  next()
}

//verify the vendor is logged in or not
const verifyLogin = (req, res, next) => {
  if (req.session.vendor) {
    next()
  } else {
    res.redirect('/vendor')
  }
}

//verify the offer is expired or not
const verifyOfferExpiry = async (req, res, next) => {
  await userhelper.verifyOfferExpiry()
  next()
}

//vendor home page
router.get('/', verifyBlocked, async function (req, res, next) {
  if (req.session.vendor == true) {
    let orders = await vendorhelper.getOrderedVendorProducts()
    let pendingorders = []
    activeOrders = 0
    totalPurchases = 0
    for (let element of orders) {
      if (element.companyId + "" === req.session.vendorId + "") {
        totalPurchases++
        if (element.status === 'Order Placed') {
          pendingorders.push(element)
          activeOrders++
        }
      }
    }
    pendingorders = pendingorders.reverse()


    let products = await producthelper.getproducts(req.session.vendorId)
    let totalproducts = products.length
    res.render('Vendor/Vendorhome', { 'vendor': true, 'vendorname': req.session.vendorname, 'activeOrders': activeOrders, 'totalproducts': totalproducts, 'totalPurchases': totalPurchases, pendingorders });
  } else {
    res.render('Vendor/vendorlogin', { 'notapproved': req.session.vendornotapproved, 'blocked': req.session.vendorblocked, 'loginerr': req.session.vendorlogerr });
    req.session.vendornotapproved = false
    req.session.vendorblocked = false
    req.session.vendorlogerr = false
  }

});

//vendor signup
router.get('/signup', function (req, res, next) {
  if (req.session.vendor) {
    res.redirect('/vendor')
  } else {
    res.render('Vendor/vendorsignup')
  }
});

//vendor signup submission
router.post('/vendorsignup', function (req, res, next) {
  vendorhelper.addvendor(req.body).then((response) => {

    if (response.vendorfound) {
      req.session.registeredvendor = true
      res.redirect('/vendor/signup')
    } else {

      req.session.vendorId = response.insertedId
      let license = req.files.license
      license.mv('./public/vendorlicense/' + response.insertedId + '.jpg')
      res.redirect('/vendor')

    }
  })
});

//vendor login
router.post('/vendorlogin', function (req, res, next) {
  vendorhelper.vendorlogin(req.body).then((response) => {
    if (response.status) {
      req.session.vendor = true;
      req.session.vendorId = response.vendorid;
      req.session.vendorname = response.vendorname;
      res.redirect('/vendor')
    } else {
      if (response.notapproved) {
        req.session.vendornotapproved = true;
        console.log("Not approved");
        res.redirect('/vendor')

      } else if (response.blocked) {
        req.session.vendorblocked = true;
        res.redirect('/vendor')
      } else {
        req.session.vendorlogerr = true;
        res.redirect('/vendor')
      }
    }
  })
});

//vendor logout
router.get('/logout', function (req, res, next) {
  req.session.vendor = false;
  res.redirect('/vendor')

});


//add products of the vendor
router.get('/addproduct', verifyLogin, verifyBlocked, function (req, res, next) {
  adminhelper.getCategoryBrandProducts().then((response) => {
    if (response.category) {
      category = response.category
    }
    if (response.brand) {
      brand = response.brand
    }

    res.render('Vendor/addproduct', { 'vendorid': req.session.vendorId, category, brand, 'productfound': req.session.productfound })

  })
});

//add product submission
router.post('/addproduct', function (req, res, next) {
  producthelper.addproduct(req.body).then((response) => {

    if (response.productfound) {
      req.session.productfound = true
      res.redirect('/vendor/addproduct')
    } else {
      let image1 = req.files.productimage1
      let image2 = req.files.productimage2
      let image3 = req.files.productimage3
      let image4 = req.files.productimage4
      image1.mv('./public/product-images/' + response.insertedId + '1.jpg')
      image2.mv('./public/product-images/' + response.insertedId + '2.jpg')
      image3.mv('./public/product-images/' + response.insertedId + '3.jpg')
      image4.mv('./public/product-images/' + response.insertedId + '4.jpg')

      res.redirect('/vendor')

    }
  })
});

//products view in vendor side
router.get('/viewproducts', verifyLogin, verifyBlocked, function (req, res, next) {

  producthelper.getproducts(req.session.vendorId).then((products) => {
    res.render('Vendor/vendorproducts', { vendor: true, products, 'vendorname': req.session.vendorname });
  })

});

//vendors can delete products
router.get('/deleteproduct/', function (req, res, next) {
  producthelper.deleteproduct(req.query.id)
  fs.unlinkSync('./public/product-images/' + req.query.id + '1.jpg')
  fs.unlinkSync('./public/product-images/' + req.query.id + '2.jpg')
  fs.unlinkSync('./public/product-images/' + req.query.id + '3.jpg')
  fs.unlinkSync('./public/product-images/' + req.query.id + '4.jpg')
  res.redirect('/vendor/viewproducts')
})

//vendors  can edit product details
router.get('/editproduct/:id', verifyLogin, async function (req, res, next) {
  let product = await producthelper.getoneproduct(req.params.id)
  adminhelper.getCategoryBrandProducts().then((response) => {
    if (response.category) {
      category = response.category
    }
    if (response.brand) {
      brand = response.brand
    }
    res.render('Vendor/edit-product', { product, category, brand })
  })
});


//update product details
router.post('/updateproduct/:id', async function (req, res, next) {
  producthelper.updateproduct(req.params.id, req.body).then(() => {
    if (req.files) {
      if (req.files.productimage1) {
        let image1 = req.files.productimage1
        image1.mv('./public/product-images/' + req.params.id + '1.jpg')
      }
      if (req.files.productimage2) {
        let image2 = req.files.productimage2
        image2.mv('./public/product-images/' + req.params.id + '2.jpg')
      }
      if (req.files.productimage3) {
        let image3 = req.files.productimage3
        image3.mv('./public/product-images/' + req.params.id + '3.jpg')
      }
      if (req.files.productimage4) {
        let image4 = req.files.productimage4
        image4.mv('./public/product-images/' + req.params.id + '4.jpg')
      }
    }
    res.redirect('/vendor/viewproducts')
  })
});


//vendor profile page
router.get('/vendorprofile', verifyLogin, verifyBlocked, async function (req, res, next) {
  vendorhelper.getvendor(req.session.vendorId).then((vendordetail) => {

    res.render('vendor/vendor-profile', { vendor: true, vendordetail })
  })
});

//update vendor details
router.post('/updatevendor', function (req, res, next) {
  vendorhelper.updatevendor(req.body).then(() => {
    res.redirect('/vendor/vendorprofile')
  })
});


//vendors can change their old password and create a new one
router.get('/changepassword', verifyLogin, verifyBlocked, function (req, res, next) {
  res.render('Vendor/change-vendorpassword', { vendor: true, 'pwordNoMatch': req.session.vendorpwordNoMatch })
});


//change password submission
router.post('/changepassword', function (req, res, next) {
  vendorhelper.changepassword(req.session.vendorId, req.body).then((response) => {
    if (response.vendorpwordNoMatch) {
      req.session.vendorpwordNoMatch = true
      res.redirect('/vendor/changepassword')
    } else {

      res.redirect('/vendor/vendorprofile')
    }
  })
});


//vendors orders page where orders to vendor is displayed
router.get('/orders', verifyLogin, verifyBlocked, function (req, res, next) {
  vendorhelper.getOrderedVendorProducts().then((orders) => {
    let vendorproducts = []
    for (let element of orders) {
      if (element.companyId + "" === req.session.vendorId + "") {
        vendorproducts.push(element)
      }
    }
    vendorproducts = vendorproducts.reverse()

    res.render('Vendor/orders', { vendor: true, 'vendorname': req.session.vendorname, vendorproducts })
  })
});

//vendors can cancel the order
router.get('/cancelorder/', function (req, res, next) {
  userhelper.cancelOrder(req.query.id).then(() => {
    res.redirect('/vendor/orders')
  })

});

//vendors can change the status of order as shipped, delivered etc.
router.get('/changeorderstatus/:id/:state', function (req, res, next) {
  vendorhelper.changeOrderStatus(req.params.id, req.params.state).then(() => {
    res.redirect("/vendor/orders")
  })

});


//vendors coupon page
router.get('/coupons', verifyLogin, verifyBlocked, function (req, res, next) {

  adminhelper.getCoupons(req.session.vendorId + "").then((vendorcoupons) => {
    res.render('Vendor/coupons-vendor', { vendor: true, vendorcoupons, 'couponExist': req.session.couponExist })
    req.session.couponExist = false;

  })
});


//add coupons by vendors
router.post('/addvendorcoupon', function (req, res, next) {
  adminhelper.addcoupon(req.body, req.session.vendorId).then((response) => {
    if (response.couponExist) {
      req.session.couponExist = true

    }
    res.redirect('/vendor/coupons')
  })
})


//offers page
router.get('/offers', verifyOfferExpiry, verifyLogin, async function (req, res, next) {
  adminhelper.getCategoryBrandProducts().then((response) => {
    if (response.category) {
      categories = response.category
    }
    producthelper.getproducts(req.session.vendorId).then((products) => {
      vendorhelper.getoffers(req.session.vendorId).then((offers) => {
        let categoryoffers = offers.categoryoffers
        let productoffers = offers.productoffers
        res.render('Vendor/offers', { vendor: true, categoryoffers, productoffers, products, categories, 'vendorId': req.session.vendorId, 'categoryOfferExist': req.session.categoryOfferExist, 'productOfferExist': req.session.productOfferExist })
        req.session.categoryOfferExist = null
        req.session.productOfferExist = null
      })
    })
  })
})


//add offer to category or products
router.post('/addOffer', verifyLogin, async function (req, res, next) {
  vendorhelper.addOffer(req.body).then((response) => {
    if (response.categoryOfferExist) {
      req.session.categoryOfferExist = true
    }
    if (response.productOfferExist) {
      req.session.productOfferExist = true
    }
    res.redirect('/vendor/offers')
  })
})


//delete offers 
router.get('/deleteoffer/', verifyLogin, verifyBlocked, function (req, res, next) {
  vendorhelper.deleteOffer(req.query.id).then(() => {
    res.redirect('/vendor/offers')
  })
});


//function to get vendor dashboard details through ajax
router.get('/getchartdata', verifyLogin, verifyBlocked, async function (req, res, next) {
 
  let vendorDashboardDetails = await vendorhelper.getVendorDashboardDetails(req.session.vendorId)

  let topselling = await adminhelper.getTopSelling(req.session.vendorId)
  res.json({ vendorDashboardDetails: vendorDashboardDetails, topselling: topselling })

});


//sales report in vendor side
router.get('/salesReport', verifyLogin, verifyBlocked, function (req, res, next) {
  let details
  if (req.session.vendorDateSelected) {
    details = req.session.vendorDateSelected

  } else {
    var today = new Date();
    var nextdate = new Date(today)
    nextdate.setDate(nextdate.getDate() - 7)
    console.log(nextdate);
    details = { from: nextdate, to: today }
  }

  vendorhelper.getSalesReport(details, req.session.vendorId).then((salesreport) => {

    from = new Date(details.from)
    to = new Date(details.to)

    if (from.getDate() < 10) {
      formattedDatefrom = "0" + from.getDate() + "-" + (from.getMonth() + 1) + "-" + from.getFullYear()
    } else {

      formattedDatefrom = from.getDate() + "-" + (from.getMonth() + 1) + "-" + from.getFullYear()
    }

    if (to.getDate() < 10) {
      formattedDateto = "0" + to.getDate() + "-" + (to.getMonth() + 1) + "-" + to.getFullYear()
    } else {

      formattedDateto = to.getDate() + "-" + (to.getMonth() + 1) + "-" + to.getFullYear()
    }



    res.render('Vendor/sales-report', { vendor: true, salesreport, 'from': formattedDatefrom, 'to': formattedDateto })
    req.session.vendorDateSelected = null
  })
})


//dates submission for sales report
router.post('/getsalesreport', verifyLogin, verifyBlocked, function (req, res, next) {

  req.session.vendorDateSelected = { from: new Date(req.body.from), to: new Date(req.body.to) }
  res.redirect('/vendor/salesreport')

})


module.exports = router;