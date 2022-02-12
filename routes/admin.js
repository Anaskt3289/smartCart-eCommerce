const { response } = require('express');
var express = require('express');
var router = express.Router();
const adminhelper = require('../Helpers/adminHelper')
const producthelper = require('../Helpers/productHelper');
const fs = require('fs')



const verifyLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin')
  }
}
/* GET users listing. */
router.get('/', function (req, res, next) {
  if (req.session.admin == true) {
    res.render('Admin/adminpage', { 'admin': true });
  } else {
    res.render('Admin/adminlogin', { 'loginerr': req.session.adminlogerr });
    req.session.adminlogerr = false
  }
});
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
router.get('/adminlogout', function (req, res, next) {
  req.session.admin = false
  res.redirect('/admin')
})
router.get('/vendorview', verifyLogin, function (req, res, next) {

  adminhelper.showvendors().then((vendors) => {
    res.render('Admin/vendorview', { admin: true, vendors });
  })

})


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


router.get('/admindashboard', function (req, res, next) {
  res.redirect('/admin')
})


router.get('/deleteproduct/:id', function (req, res, next) {
  producthelper.deleteproduct(req.params.id)
  fs.unlinkSync('./public/product-images/' + req.params.id + '1.jpg')
  fs.unlinkSync('./public/product-images/' + req.params.id + '2.jpg')
  fs.unlinkSync('./public/product-images/' + req.params.id + '3.jpg')
  fs.unlinkSync('./public/product-images/' + req.params.id + '4.jpg')
  res.redirect('/admin/viewproducts/')
})


router.get('/deletevendor/', function (req, res, next) {

  adminhelper.deletevendor(req.query.id).then(() => {
    fs.unlinkSync('./public/vendorlicense/' + req.query.id + '.jpg')
    res.redirect('/admin/vendorview')
  })

})


router.get('/blockvendor/:id', function (req, res, next) {
  adminhelper.blockvendor(req.params.id).then(() => {

    res.redirect('/admin/vendorview')
  })
});


router.get('/unblockvendor/:id', function (req, res, next) {
  adminhelper.unblockvendor(req.params.id).then(() => {
    res.redirect('/admin/vendorview')
  })
});


router.get('/vendorrequests', verifyLogin, function (req, res, next) {

  adminhelper.vendorrequests().then((vendors) => {
    res.render('Admin/vendor-requests', { admin: true, vendors });
  })

});


router.get('/acceptvendor/:id', function (req, res, next) {
  adminhelper.acceptvendor(req.params.id)
  res.redirect('/admin/vendorrequests')
});


router.get('/rejectvendor/:id', function (req, res, next) {
  adminhelper.deletevendor(req.params.id)
  res.redirect('/admin/vendorrequests')
});

router.get('/userview', verifyLogin, function (req, res, next) {
  adminhelper.getusers().then((users) => {
    res.render('Admin/userview', { admin: true, users })
  })
});

router.get('/blockuser/:id', function (req, res, next) {
  adminhelper.blockuser(req.params.id).then(() => {
    req.session.user = false;
    res.redirect('/admin/userview')
  })
});
router.get('/unblockuser/:id', function (req, res, next) {
  adminhelper.unblockuser(req.params.id).then(() => {
    res.redirect('/admin/userview')
  })
});

router.get('/deleteuser/', function (req, res, next) {
  adminhelper.deleteuser(req.query.id).then(() => {
    fs.unlinkSync('./public/User-Profile-Pics/' + req.query.id + '.jpg')
    res.redirect('/admin/userview')
  })

})


router.get('/banners', verifyLogin, function (req, res, next) {
  adminhelper.getbanners().then((banners) => {

    res.render('Admin/banners', { admin: true, banners })
  })
})

router.get('/editbanners/', function (req, res, next) {
  adminhelper.getOneBanner(req.query.id).then((banner) => {

    res.render('Admin/edit-banners', { admin: true, banner })

  })
})

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
module.exports = router;
