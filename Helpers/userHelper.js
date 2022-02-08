var db = require('../Config/Connection')
var collection = require('../Config/Collection')
const async = require('hbs/lib/async')

const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { reject } = require('bcrypt/promises')
const res = require('express/lib/response')

module.exports = {
    adduserdetails: (details) => {
        return new Promise(async (resolve, reject) => {
            details.pword = await bcrypt.hash(details.pword, 10)
            details.repeatpword = details.pword
            details.mobile = `+91${details.mobile}`
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
        if(category=='Allproducts'){
            return new Promise(async (resolve, reject) => {
                let products = await db.get().collection(collection.products).find({}).toArray();
                resolve(products)
            })
        }else{
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.products).find({category:category}).toArray();
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
            db.get().collection(collection.usercollection).findOne({ mobile: mobile }).then((user) => {
                resolve(user)
            })
        })

    },
    addToCart: (productId, userId) => {
        let prodObj = {
            item: ObjectId(productId),
            quantity: 1
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
    removeCartProduct: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.cart).updateOne({ _id: ObjectId(details.cart) },
                {
                    $pull: { products: { item: ObjectId(details.product) } }
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
            resolve(cartTotal)
        })
    },
    addAddress: (userId, details) => {
        address = details.address + " ,    PIN: " + details.pin +
            ",     Contact:" + details.mobile

        return new Promise(async (resolve, reject) => {
            let userAddress = await db.get().collection(collection.usercollection).findOne({ _id: ObjectId(userId) })
            if (userAddress) {
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
    placeorder: (orderDetails, products) => {
        return new Promise((resolve, reject) => {
            let status = orderDetails.paymentmethod === 'COD' ? 'Order Placed' : 'Pending'
            let orderObj = {

                deliveryaddress: orderDetails.address,
                user: ObjectId(orderDetails.user),
                paymentmethod: orderDetails.paymentmethod,
                total: orderDetails.total,
                products: products,
                status: status,
                date: (new Date()).toDateString()
            }
            db.get().collection(collection.orders).insertOne(orderObj).then((response) => {
                db.get().collection(collection.cart).deleteOne({ user: ObjectId(orderDetails.user) })
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
                product:new RegExp('.*' + searchkey + '.*')
            }).toArray()
            console.log(searchedProducts);
            resolve(searchedProducts)
        })
    }
}

