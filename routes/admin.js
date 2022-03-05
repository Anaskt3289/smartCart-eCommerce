
var express = require('express');
var router = express.Router();
const adminhelper = require('../Helpers/adminHelper')
const userhelper = require('../Helpers/userHelper')
const producthelper = require('../Helpers/productHelper');
const fs = require('fs');
const async = require('hbs/lib/async');


//function to verify admin is logged in or not
const verifyLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin')
  }
}


//admin homepage
router.get('/', async function (req, res, next) {
  if (req.session.admin == true) {
    let usercount = await adminhelper.getUserCount()
    let vendorcount = await adminhelper.getVendorCount()
    let recentOrders = await adminhelper.recentOrders()

    res.render('Admin/adminpage', { 'admin': true, 'usercount': usercount, 'vendorcount': vendorcount, recentOrders });
  } else {
    res.render('Admin/adminlogin', { 'loginerr': req.session.adminlogerr });
    req.session.adminlogerr = false
  }
});

//admin loginpage
router.post('/adminlogin', function (req, res, next) {
  adminhelper.adminlogin(req.body).then((resp) => {
    if (resp) {
      req.session.admin = true;
      res.redirect('/admin')
    } else {
      req.session.adminlogerr = true;
      res.redirect('/admin')
    }
  })
});

//admin logout
router.get('/adminlogout', function (req, res, next) {
  req.session.admin = false
  res.redirect('/admin')
})

//vendor view in admin side
router.get('/vendorview', verifyLogin, function (req, res, next) {

  adminhelper.showvendors().then((vendors) => {
    res.render('Admin/vendorview', { admin: true, vendors });
  })

})

//products view in admin side
router.get('/viewproducts/', verifyLogin, function (req, res, next) {
  if (req.session.admin) {
    if (req.query.id) {
      vendorId = req.query.id
      req.session.companyId = req.query.id
    } else {
      vendorId = req.session.companyId
    }
    producthelper.getproducts(vendorId).then((products) => {
      console.log(products);
      res.render('Admin/productsview', { admin: true, products });
    })
  } else {
    res.redirect('/admin')
  }
})

//admin can disable or enable products
router.get('/disableOrEnableproduct/:id/:type', function (req, res, next) {
  adminhelper.disableOrEnableproduct(req.params.id, req.params.type).then(() => {
    res.redirect('/admin/viewproducts/')
  })

})


//admin can delete vendors
router.get('/deletevendor/', function (req, res, next) {
  adminhelper.deletevendor(req.query.id).then(() => {
    fs.unlinkSync('./public/vendorlicense/' + req.query.id + '.jpg')
    res.redirect('/admin/vendorview')
  })

})

//admin can block vendors
router.get('/blockvendor/:id', function (req, res, next) {
  adminhelper.blockvendor(req.params.id).then(() => {

    res.redirect('/admin/vendorview')
  })
});

//admin can unblock vendors
router.get('/unblockvendor/:id', function (req, res, next) {
  adminhelper.unblockvendor(req.params.id).then(() => {
    res.redirect('/admin/vendorview')
  })
});

//admin can view newly registered vendors
router.get('/vendorrequests', verifyLogin, function (req, res, next) {
  adminhelper.vendorrequests().then((vendors) => {
    res.render('Admin/vendor-requests', { admin: true, vendors });
  })

});


//admin can accept newly registered vendors
router.get('/acceptvendor/:id', function (req, res, next) {
  adminhelper.acceptvendor(req.params.id)
  res.redirect('/admin/vendorrequests')
});

//admin can reject newly registered vendors
router.get('/rejectvendor/:id', function (req, res, next) {
  adminhelper.deletevendor(req.params.id)
  res.redirect('/admin/vendorrequests')
});

//users view in admin side
router.get('/userview', verifyLogin, function (req, res, next) {
  adminhelper.getusers().then((users) => {
    res.render('Admin/userview', { admin: true, users })
  })
});

//admin can block users 
router.get('/blockuser/:id', function (req, res, next) {
  adminhelper.blockuser(req.params.id).then(() => {
    req.session.user = false;
    res.redirect('/admin/userview')
  })
});

//admin can unblock users
router.get('/unblockuser/:id', function (req, res, next) {
  adminhelper.unblockuser(req.params.id).then(() => {
    res.redirect('/admin/userview')
  })
});

//admin can delete users
router.get('/deleteuser/', function (req, res, next) {
  adminhelper.deleteuser(req.query.id).then(() => {
    fs.unlinkSync('./public/User-Profile-Pics/' + req.query.id + '.jpg')
    res.redirect('/admin/userview')
  })

})

//admin can view banners and sliders in user homepage
router.get('/banners', verifyLogin, function (req, res, next) {
  adminhelper.getbanners().then((banners) => {
    res.render('Admin/banners', { admin: true, banners })
  })
})

//admin can edit banners and sliders
router.get('/editbanners/', function (req, res, next) {
  adminhelper.getOneBanner(req.query.id).then((banner) => {
    adminhelper.getCategoryBrandProducts().then((response) => {
      if (response.category) {
        category = response.category
      }
      res.render('Admin/edit-banners', { admin: true, banner, category })
    })
  })
})


//admin can update banners and sliders
router.post('/updatebanners', function (req, res, next) {
  console.log(req.body);
  adminhelper.updatebanner(req.body.bannerId, req.body).then(() => {
    if (req.files) {
      let image1 = req.files.bannerpic
      image1.mv('./public/banners/' + req.body.banner + '.jpg')
    }
    res.redirect('/admin/banners')
  })
})

//admin can view category and brands
router.get('/category&brands', verifyLogin, function (req, res, next) {
  category = null
  brand = null
  adminhelper.getCategoryBrandProducts().then((response) => {
    if (response.category) {
      category = response.category
    }
    if (response.brand) {
      brand = response.brand
    }
    res.render('Admin/category&brands', { admin: true, category, brand, 'categoryExist': req.session.categoryExist, 'brandExist': req.session.brandExist })
    req.session.brandExist = false
    req.session.categoryExist = false
  })
})

//admin can add category
router.post('/addCategory', function (req, res, next) {
  adminhelper.addCategory(req.body).then((response) => {
    if (response.categoryExist) {
      req.session.categoryExist = true
    }
    res.redirect('/admin/category&brands')
  })
})

//admin can add brand
router.post('/addBrand', function (req, res, next) {
  adminhelper.addBrand(req.body).then((response) => {
    if (response.brandExist) {
      req.session.brandExist = true
    }
    res.redirect('/admin/category&brands')
  })
})

// admin can delete category
router.get('/deletecategory/', function (req, res, next) {
  adminhelper.deleteCategory(req.query.category).then(() => {
    res.redirect('/admin/category&brands')
  })
})

//admin can delete brand
router.get('/deletebrand/', function (req, res, next) {
  adminhelper.deleteBrand(req.query.brand).then(() => {
    res.redirect('/admin/category&brands')
  })
})

//admin can view coupons
router.get('/coupons', verifyLogin, function (req, res, next) {
  adminhelper.getCoupons('admin').then((admincoupons) => {
    res.render('Admin/coupons', { admin: true, admincoupons, 'couponExist': req.session.couponExist })
    req.session.couponExist = false;

  })
})

//admin can add coupons
router.post('/addcoupon', function (req, res, next) {
  authorizer = 'admin'
  adminhelper.addcoupon(req.body, authorizer).then((response) => {
    if (response.couponExist) {
      req.session.couponExist = true
    }
    res.redirect('/admin/coupons')
  })
})

//admin can delete coupons
router.get('/deletecoupon/', function (req, res, next) {
  adminhelper.deleteCoupon(req.query.id).then(() => {
    res.redirect('/admin/coupons')

  })
})

//ajax function to get chart datas in admin 
router.get('/getchartdata', async function (req, res, next) {
  let orderdetails = await adminhelper.getOrderDetails()
  let topselling = await adminhelper.getTopSelling('admin')
  console.log(topselling.topsellingCat);
  res.json({ orderdetails: orderdetails, topselling: topselling })
})

//sales report in admin side
router.get('/salesreport', verifyLogin, function (req, res, next) {
  let details
  if (req.session.dateSelected) {
    details = req.session.dateSelected
  } else {
    var today = new Date();
    var nextdate = new Date(today)
    nextdate.setDate(nextdate.getDate() - 7)
    console.log(nextdate);
    details = { from: nextdate, to: today }

  }
  adminhelper.getSalesReport(details).then((salesreport) => {
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

    res.render('Admin/sales-report', { admin: true, salesreport, 'from': formattedDatefrom, 'to': formattedDateto})
    req.session.dateSelected = null
  })

})


//function to get sales report by dates
router.post('/getsalesreport', verifyLogin, function (req, res, next) {
  req.session.dateSelected = {from:new Date(req.body.from),to:new Date(req.body.to)}
  res.redirect('/admin/salesreport')

})


//user report in admin side
router.get('/userReport', verifyLogin, function (req, res, next) {

  adminhelper.getUserReport().then((userReport) => {

    res.render('Admin/user-report', { admin: true, userReport })
  })

})


//vendor report in admin side
router.get('/vendorReport', verifyLogin, function (req, res, next) {

  adminhelper.getVendorReport().then((vendorReport) => {

    res.render('Admin/vendor-report', { admin: true, vendorReport })
  })

})





module.exports = router;
