const { response } = require('express');
var express = require('express');
var router = express.Router();
const adminhelper = require('../Helpers/adminHelper')
const userhelper = require('../Helpers/userHelper')
const producthelper = require('../Helpers/productHelper');
const fs = require('fs');
const async = require('hbs/lib/async');



const verifyLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin')
  }
}
/* GET users listing. */
router.get('/', async function (req, res, next) {
  if (req.session.admin == true) {
let usercount = await adminhelper.getUserCount()
let vendorcount = await adminhelper.getVendorCount()
let recentOrders = await adminhelper.recentOrders()

    res.render('Admin/adminpage', { 'admin': true ,'usercount':usercount,'vendorcount':vendorcount,recentOrders});
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
    adminhelper.getCategoryBrandProducts().then((response)=>{
      if(response.category){
        category = response.category
      }
      res.render('Admin/edit-banners', { admin: true, banner ,category})
     
    })

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


router.get('/category&brands',verifyLogin,function (req, res, next) {
   category=null
   brand=null
  adminhelper.getCategoryBrandProducts().then((response)=>{
    if(response.category){
      category = response.category
    }
    if(response.brand){
      brand = response.brand
    }
    res.render('Admin/category&brands',{admin:true,category,brand,'categoryExist':req.session.categoryExist,'brandExist':req.session.brandExist})
    req.session.brandExist=false
    req.session.categoryExist=false
  })

})
router.post('/addCategory',function (req, res, next) {
  adminhelper.addCategory(req.body).then((response)=>{
    if(response.categoryExist){
      req.session.categoryExist=true
    }
    res.redirect('/admin/category&brands')
  })
})

router.post('/addBrand',function (req, res, next) {
  adminhelper.addBrand(req.body).then((response)=>{
    if(response.brandExist){
      req.session.brandExist=true
    }
    res.redirect('/admin/category&brands')
  })
})
router.get('/deletecategory/',function (req, res, next) {
  adminhelper.deleteCategory(req.query.category).then(()=>{
    res.redirect('/admin/category&brands')
  })
 
})

router.get('/deletebrand/',function (req, res, next) {
  adminhelper.deleteBrand(req.query.brand).then(()=>{
    res.redirect('/admin/category&brands')
  })
 
})

router.get('/coupons', verifyLogin, function (req, res, next) {
  adminhelper.getCoupons('admin').then((admincoupons)=>{
    res.render('Admin/coupons',{admin:true ,admincoupons, 'couponExist':req.session.couponExist})
    req.session.couponExist=false;

  })
})


router.post('/addcoupon',function (req, res, next) {
  authorizer='admin'
  adminhelper.addcoupon(req.body,authorizer).then((response)=>{
    if(response.couponExist){
      req.session.couponExist=true
      
    }

      res.redirect('/admin/coupons')
    
  })
 })


 router.get('/deletecoupon/',function (req, res, next) {
  adminhelper.deleteCoupon(req.query.id).then(()=>{
    res.redirect('/admin/coupons')

  })
})

router.get('/getchartdata',async function (req, res, next) {
 
  let orderdetails = await adminhelper.getOrderDetails()
 
  let topselling = await adminhelper.getTopSelling('admin')
  console.log(topselling.topsellingCat);
  res.json({orderdetails:orderdetails,topselling:topselling})
})




module.exports = router;
