var express = require('express');
var router = express.Router();
const vendorhelper = require('../Helpers/vendorHelper')
const producthelper = require('../Helpers/productHelper');
const { response } = require('express');
const { redirect } = require('express/lib/response');
const fs = require('fs')

router.get('/', function (req, res, next) {
  if (req.session.vendor == true) {
    res.render('Vendor/Vendorhome', { 'vendor': true, 'vendorname': req.session.vendorname });
  } else {
    res.render('Vendor/vendorlogin', { 'notapproved': req.session.vendornotapproved, 'blocked': req.session.vendorblocked, 'loginerr': req.session.vendorlogerr });
    req.session.vendornotapproved = false
    req.session.vendorblocked = false
    req.session.vendorlogerr = false
  }

});
router.get('/signup', function (req, res, next) {
  if (req.session.vendor) {
    res.redirect('/vendor')
  } else {
    res.render('Vendor/vendorsignup')
  }
});
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
router.get('/logout', function (req, res, next) {
  req.session.vendor = false;
  res.redirect('/vendor')

});

router.get('/addproduct', function (req, res, next) {
  if (req.session.vendor) {
    res.render('Vendor/addproduct', { 'vendorid': req.session.vendorId, 'productfound': req.session.productfound })
  } else {
    res.redirect('/vendor')
  }
});
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
router.get('/viewproducts', function (req, res, next) {
  if (req.session.vendor) {
    producthelper.getproducts(req.session.vendorId).then((products) => {
      res.render('Vendor/vendorproducts', { vendor: true, products, 'vendorname': req.session.vendorname });
    })
  } else {
    res.redirect('/vendor')
  }
});
router.get('/deleteproduct/', function (req, res, next) {
  producthelper.deleteproduct(req.query.id)
  fs.unlinkSync('./public/product-images/' + req.query.id + '1.jpg')
  fs.unlinkSync('./public/product-images/' + req.query.id + '2.jpg')
  fs.unlinkSync('./public/product-images/' + req.query.id + '3.jpg')
  fs.unlinkSync('./public/product-images/' + req.query.id + '4.jpg')
  res.redirect('/vendor/viewproducts')
})
router.get('/editproduct/:id', async function (req, res, next) {
  let product = await producthelper.getoneproduct(req.params.id)
  if (req.session.vendor) {
    console.log(product);
    res.render('Vendor/edit-product', { product })
  } else {
    res.redirect('/vendor')
  }
});
router.get('/vendordashboard', async function (req, res, next) {
  res.redirect('/vendor')
});
router.post('/updateproduct/:id', async function (req, res, next) {
  producthelper.updateproduct(req.params.id, req.body).then(() => {
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
    res.redirect('/vendor/viewproducts')
  })
});

module.exports = router;