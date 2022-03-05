var db = require('../Config/Connection')
var collection = require('../Config/Collection')
const async = require('hbs/lib/async')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { reject, promise } = require('bcrypt/promises')
const Razorpay = require('razorpay')
const { resolve } = require('path')
const vendorhelper = require('./vendorHelper')






const razorpaySecret = process.env.razorpaySecret
var instance = new Razorpay({
    key_id: 'rzp_test_P71kVccMvd0JVS',
    key_secret: razorpaySecret
});



module.exports = {
    adduserdetails: (details) => {
        return new Promise(async (resolve, reject) => {
            details.pword = await bcrypt.hash(details.pword, 10)
            details.repeatpword = details.pword

            db.get().collection(collection.usercollection).insertOne(details).then((data) => {
                resolve(data)
            })
        })

    },
    userlogin: (userdata) => {
        return new Promise(async (resolve, reject) => {

            let response = {}
            let user = await db.get().collection(collection.usercollection).findOne({ email: userdata.email })

            if (user) {
                if (user.blocked) {
                    response.status = false

                    response.blocked = true
                    resolve(response)
                }
                bcrypt.compare(userdata.pword, user.pword).then((state) => {
                    if (state) {
                        response.status = true
                        response.userid = user._id
                        response.mobile = user.mobile
                        response.user = user.fname
                        resolve(response)
                    } else {
                        response.status = false
                        response.blocked = false
                        resolve(response)
                    }
                })
            } else {
                response = false
                resolve(response)
            }
        })
    },
    getproducts: (category) => {
        response = {}
        if (category == 'Allproducts') {
            return new Promise(async (resolve, reject) => {
                products = await db.get().collection(collection.products).find({ quantity: { $ne: 0 }, disabled: { $exists: false } }).toArray();


                for (element of products) {

                    discountDetails = {}

                    if (element.categorydiscount && element.productdiscount) {
                        categorydiscount = parseInt(element.categorydiscount)
                        productdiscount = parseInt(element.productdiscount)

                        discountDetails.discount = (categorydiscount > productdiscount) ? categorydiscount : productdiscount
                        discountDetails.discountedamount = (element.price) * discountDetails.discount / 100
                        discountDetails.currentprice = (element.price) - discountDetails.discountedamount
                        element.discountDetails = discountDetails

                    } else if (element.categorydiscount) {
                        categorydiscount = parseInt(element.categorydiscount)

                        discountDetails.discount = categorydiscount
                        discountDetails.discountedamount = (element.price) * discountDetails.discount / 100
                        discountDetails.currentprice = (element.price) - discountDetails.discountedamount
                        element.discountDetails = discountDetails



                    } else if (element.productdiscount) {
                        productdiscount = parseInt(element.productdiscount)

                        discountDetails.discount = productdiscount
                        discountDetails.discountedamount = (element.price) * discountDetails.discount / 100
                        discountDetails.currentprice = (element.price) - discountDetails.discountedamount
                        element.discountDetails = discountDetails



                    }
                }


                resolve(products)
            })
        } else {
            return new Promise(async (resolve, reject) => {
                let products = await db.get().collection(collection.products).find({ category: category, quantity: { $ne: 0 }, disabled: { $exists: false } }).toArray();
                for (element of products) {
                    discountDetails = {}

                    if (element.categorydiscount && element.productdiscount) {
                        categorydiscount = parseInt(element.categorydiscount)
                        productdiscount = parseInt(element.productdiscount)

                        discountDetails.discount = (categorydiscount > productdiscount) ? categorydiscount : productdiscount
                        discountDetails.discountedamount = (element.price) * discountDetails.discount / 100
                        discountDetails.currentprice = (element.price) - discountDetails.discountedamount
                        element.discountDetails = discountDetails

                    } else if (element.categorydiscount) {
                        categorydiscount = parseInt(element.categorydiscount)

                        discountDetails.discount = categorydiscount
                        discountDetails.discountedamount = (element.price) * discountDetails.discount / 100
                        discountDetails.currentprice = (element.price) - discountDetails.discountedamount
                        element.discountDetails = discountDetails



                    } else if (element.productdiscount) {
                        productdiscount = parseInt(element.productdiscount)

                        discountDetails.discount = productdiscount
                        discountDetails.discountedamount = (element.price) * discountDetails.discount / 100
                        discountDetails.currentprice = (element.price) - discountDetails.discountedamount
                        element.discountDetails = discountDetails



                    }
                }
                resolve(products)
            })
        }
    },
    getUserdetails: (mobilenumber, email) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.usercollection).findOne({ $or: [{ mobile: mobilenumber }, { email: email }] })
            resolve(user)
            console.log(user);
        })
    },
    getdata: (mobile) => {
        return new Promise((resolve, reject) => {
            number = mobile.substring(3)
            db.get().collection(collection.usercollection).findOne({ mobile: number }).then((user) => {
                resolve(user)
            })
        })

    },
    addToCart: (productId, productquantity, userId) => {
        let prodObj = {
            item: ObjectId(productId),
            quantity: parseInt(productquantity)
        }
        return new Promise(async (resolve, reject) => {
            response = {}
            let userCart = await db.get().collection(collection.cart).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == productId)

                if (proExist != -1) {
                    db.get().collection(collection.cart).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(productId) },
                        { $inc: { 'products.$.quantity': 1 } }
                    )
                    response.productInCart = true
                    resolve(response)

                } else {
                    db.get().collection(collection.cart).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: prodObj }
                        })
                    response.productInCart = false
                    resolve(response)
                }
            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.cart).insertOne(cartObj)
                response.productInCart = false
                resolve(response)
            }
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let userCart = await db.get().collection(collection.cart).findOne({ user: ObjectId(userId) })
            if (userCart) {
                count = userCart.products.length
            }
            resolve(count)
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartProducts = await db.get().collection(collection.cart).aggregate([
                { $match: { user: ObjectId(userId) } },
                { $unwind: '$products' },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.products,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] },
                        subtotal: { $multiply: [{ $arrayElemAt: ["$product.price", 0] }, "$quantity"] },
                    }
                }
            ]).toArray()



            for (element of cartProducts) {



                discountDetails = {}

                if (element.product.categorydiscount && element.product.productdiscount) {
                    categorydiscount = parseInt(element.product.categorydiscount)
                    productdiscount = parseInt(element.product.productdiscount)

                    discountDetails.discount = (categorydiscount > productdiscount) ? categorydiscount : productdiscount
                    discountDetails.discountedamount = (element.product.price) * discountDetails.discount / 100
                    discountDetails.currentprice = (element.product.price) - discountDetails.discountedamount
                    discountDetails.subtotal = (element.quantity) * discountDetails.currentprice
                    element.product.discountDetails = discountDetails

                } else if (element.product.categorydiscount) {
                    categorydiscount = parseInt(element.product.categorydiscount)

                    discountDetails.discount = categorydiscount
                    discountDetails.discountedamount = (element.product.price) * discountDetails.discount / 100
                    discountDetails.currentprice = (element.product.price) - discountDetails.discountedamount
                    discountDetails.subtotal = (element.quantity) * discountDetails.currentprice
                    element.product.discountDetails = discountDetails



                } else if (element.product.productdiscount) {
                    productdiscount = parseInt(element.product.productdiscount)

                    discountDetails.discount = productdiscount
                    discountDetails.discountedamount = (element.product.price) * discountDetails.discount / 100
                    discountDetails.currentprice = (element.product.price) - discountDetails.discountedamount
                    discountDetails.subtotal = (element.quantity) * discountDetails.currentprice
                    element.product.discountDetails = discountDetails



                }
            }



            resolve(cartProducts)
        })
    },
    changeCartQuantity: (details) => {
        let resp = {}
        quantity = parseInt(details.quantity)
        count = parseInt(details.count)
        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {
                db.get().collection(collection.cart).updateOne({ _id: ObjectId(details.cart) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then((response) => {
                    resp.removeProduct = true
                    resolve(resp)
                })
            } else {
                db.get().collection(collection.cart).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                    { $inc: { 'products.$.quantity': count } }
                ).then((response) => {
                    resp.status = true
                    resolve(resp)
                })
            }
        })
    },
    removeCartProduct: (userId, productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.cart).updateOne({ user: ObjectId(userId) },
                {
                    $pull: { products: { item: ObjectId(productId) } }
                }
            ).then(() => {
                resolve()
            })
        })
    },
    getCartTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartTotal = await db.get().collection(collection.cart).aggregate([
                { $match: { user: ObjectId(userId) } },
                { $unwind: '$products' },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.products,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },

                {
                    $project: {
                        item: 1,
                        subtotal: { $multiply: [{ $arrayElemAt: ["$product.price", 0] }, "$quantity"] },
                    }
                }
            ]).toArray()
            console.log(cartTotal);
            resolve(cartTotal)
        })
    },
    addAddress: (userId, details) => {
        address = details.address + " ,    PIN: " + details.pin +
            ",     Contact:" + details.mobile

        return new Promise(async (resolve, reject) => {
            let userAddress = await db.get().collection(collection.usercollection).findOne({ _id: ObjectId(userId) })
            if (userAddress.address) {
                db.get().collection(collection.usercollection).updateOne({ _id: ObjectId(userId) },
                    {
                        $push: { address: { address } }
                    }).then(() => {
                        resolve()
                    })
            } else {
                db.get().collection(collection.usercollection).updateOne({ _id: ObjectId(userId) },
                    {
                        $set: { address: [{ address }] }
                    }).then(() => {
                        resolve()
                    })
            }
        })
    },
    getaddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.usercollection).findOne({ _id: ObjectId(userId) })
            resolve(user.address)
        })
    },
    orderPlacedProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.cart).findOne({ user: ObjectId(userId) })
            resolve(cart.products)

        })
    },
    placeorder: (orderDetails, products, type) => {

        return new Promise((resolve, reject) => {



            if (type === 'buynow') {
                products = [{
                    item: ObjectId(products._id),
                    quantity: 1
                }]
                orderObj = {

                    deliveryaddress: orderDetails.address,
                    user: ObjectId(orderDetails.user),
                    paymentmethod: orderDetails.paymentmethod,
                    total: orderDetails.total,
                    products: products,
                    status: 'Order Placed',
                    date: (new Date()).toDateString()
                }
            } else {
                for (let element of products) {
                    element.item = ObjectId(element.item)
                };
                orderObj = {

                    deliveryaddress: orderDetails.address,
                    user: ObjectId(orderDetails.user),
                    paymentmethod: orderDetails.paymentmethod,
                    total: orderDetails.total,
                    products: products,
                    status: 'Order Placed',
                    date: (new Date()).toDateString()
                }
            }


            db.get().collection(collection.orders).insertOne(orderObj).then(async (response) => {
                console.log(products);
                await db.get().collection(collection.cart).deleteOne({ user: ObjectId(orderDetails.user) })
                for (let product of products) {
                    db.get().collection(collection.products).updateOne({ _id: product.item }, {
                        $inc: { quantity: -product.quantity }
                    })
                }
                resolve(response)
            })

        })
    },
    getOrderDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.orders).aggregate([
                { $match: { _id: ObjectId(orderId) } },
                {
                    $project: {
                        deliveryaddress: 1, paymentmethod: 1, total: 1, status: 1, date: 1,
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.products,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }
            ]).toArray()

            resolve(orders)
        })
    },
    myOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.orders).aggregate([
                { $match: { user: ObjectId(userId) } },
                { $unwind: '$products' },
                {
                    $project: {
                        deliveryaddress: 1, paymentmethod: 1, total: 1, status: 1, date: 1,
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.products,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }
            ]).toArray()

            resolve(orders)
        })
    },
    search: (searchkey) => {
        return new Promise(async (resolve, reject) => {
            let searchedProducts = await db.get().collection(collection.products).find({
                
                product: { $regex: searchkey, $options: "$i" }

            }).toArray()
            console.log(searchedProducts);
            resolve(searchedProducts)
        })
    },
    getUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.usercollection).findOne({ _id: ObjectId(userId) })
            resolve(user)
        })
    },

    removeaddress: (userId, value) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.usercollection).updateOne({ _id: ObjectId(userId) }, {
                $pull: { address: { address: value } }
            }).then(() => {
                resolve()
            })
        })
    },
    updateuser: (details) => {

        return new Promise((resolve, reject) => {
            addressObj = []
            for (let adr of details.address) {
                addressObj.push({ address: adr })
            }

            db.get().collection(collection.usercollection).updateOne({ _id: ObjectId(details.userId) }, {
                $set: { fname: details.fname, email: details.email, mobile: details.mobile, address: addressObj }
            }).then(() => {
                resolve()
            })
        })

    },
    changepassword: (userId, details) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.usercollection).findOne({ _id: ObjectId(userId) })
            bcrypt.compare(details.oldpword, user.pword).then(async (state) => {
                if (state) {
                    response.pwordDoesNotMatch = false
                    newpword = await bcrypt.hash(details.newpword, 10)
                    newrepeatpword = newpword
                    db.get().collection(collection.usercollection).updateOne({ _id: ObjectId(userId) },
                        {
                            $set: { pword: newpword, repeatpword: newrepeatpword }
                        }).then(() => {
                            resolve(response)
                        })
                }
                else {
                    response.pwordDoesNotMatch = true
                    resolve(response)
                }
            })
        })
    },
    generateRazorpay: (total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: parseInt(total) * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "637gfjgwjhjghgjh"
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    resolve(order)
                }
            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            var crypto = require("crypto");
            var expectedSignature = crypto.createHmac('sha256', 'lhrJcoiEGENMCMPCxOzHRfJs')
                .update(details['paymentdetails[razorpay_order_id]'] + '|' + details['paymentdetails[razorpay_payment_id]'])
                .digest('hex');


            if (expectedSignature === details['paymentdetails[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }

        })
    },
    addOnlinePaymentOrders: () => {

    },

    cancelOrder: (orderid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.orders).updateOne({ _id: ObjectId(orderid) },
                {
                    $set: {
                        status: 'Cancelled'
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    addtoWishlist: (productId, userId) => {

        return new Promise(async (resolve, reject) => {
            response = {}
            let userWishlist = await db.get().collection(collection.wishlist).findOne({ user: ObjectId(userId) })
            if (userWishlist) {
                let proExist = userWishlist.products.findIndex(product => product.item == productId)

                if (proExist != -1) {

                    response.productInWishlist = true
                    resolve(response)

                } else {
                    await db.get().collection(collection.wishlist).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: { item: ObjectId(productId) } }
                        })

                    await db.get().collection(collection.products).updateOne({ _id: ObjectId(productId) },
                        {
                            $set: { wishlist: true }
                        })
                    response.productInWishlist = false
                    resolve(response)
                }
            } else {
                let wishlistObj = {
                    user: ObjectId(userId),
                    products: [{ item: ObjectId(productId) }]
                }
                db.get().collection(collection.wishlist).insertOne(wishlistObj)
                response.productInWishlist = false
                resolve(response)
            }
        })
    },
    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlistProducts = await db.get().collection(collection.wishlist).aggregate([
                { $match: { user: ObjectId(userId) } },
                { $unwind: '$products' },
                {
                    $project: {
                        item: '$products.item',
                    }
                },
                {
                    $lookup: {
                        from: collection.products,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        _id: 0, product: { $arrayElemAt: ['$product', 0] },

                    }
                }
            ]).toArray()

            resolve(wishlistProducts)
        })
    },
    removefromWishlist: (proId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.wishlist).updateOne({ user: ObjectId(userId) },
                {
                    $pull: { products: { item: ObjectId(proId) } }
                }
            ).then(async () => {
                await db.get().collection(collection.products).updateOne({ _id: ObjectId(proId) },
                    {
                        $unset: { wishlist: true }
                    })
                resolve()
            })
        })
    },
    wishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let userWishlist = await db.get().collection(collection.wishlist).findOne({ user: ObjectId(userId) })
            if (userWishlist) {
                count = userWishlist.products.length
            }
            resolve(count)
        })
    },
    getAllCoupons: (userId) => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.coupons).find().toArray()

            let date = Date.now();
            nonexpiredCoupons = []
            for (let element of coupons) {
                if (new Date(element.expirydate) < date) {
                    await db.get().collection(collection.coupons).deleteOne({ _id: element._id })
                } else {
                    applied = await db.get().collection(collection.usercollection).findOne({ _id: ObjectId(userId), appliedcoupons: { coupon: element.couponcode } })

                    if (!applied) {
                        nonexpiredCoupons.push(element)
                    }
                }
            }
            resolve(nonexpiredCoupons)
        })
    },
    verifyOfferExpiry: () => {
        return new Promise(async (resolve, reject) => {
            let offers = await db.get().collection(collection.offers).find().toArray()
            let date = Date.now();
            for (let element of offers) {
                if (new Date(element.expirydate) < date) {
                    vendorhelper.deleteOffer(element._id)
                }
            }
            resolve()
        })
    },
    addAppliedCoupons: (userId, couponcode) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.usercollection).updateOne({ _id: ObjectId(userId) },
                {
                    $push: { appliedcoupons: { coupon: couponcode } }
                }).then(() => {
                    resolve()
                })
        })
    },

    sortProducts: (value) => {
        return new Promise(async (resolve, reject) => {
            let sortedProducts
            if (value === 'lowToHigh') {
                sortedProducts = await db.get().collection(collection.products).find({ disabled: { $exists: false } }).sort({ price: 1 }).toArray()
            } else {
                sortedProducts = await db.get().collection(collection.products).find({ disabled: { $exists: false } }).sort({ price: -1 }).toArray()
            }

            resolve(sortedProducts)
        })
    },
    submitreview: (details) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.reviews).insertOne(details).then(() => {
                resolve()
            })
        })
    },
    getReviews: () => {
        return new Promise(async (resolve, reject) => {
            let reviews = await db.get().collection(collection.reviews).find().toArray()
            resolve(reviews)
        })
    },
    getHomeProducts: (count) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.products).find({ disabled: { $exists: false } }).limit(count * 8).toArray()
            resolve(products)
        })
    }
}

