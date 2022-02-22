var db = require('../Config/Connection')
var collection = require('../Config/Collection')
const async = require('hbs/lib/async')
const bcrypt = require('bcrypt')
const { reject } = require('bcrypt/promises')
const { ObjectId } = require('mongodb')



module.exports = {
    addvendor: (details) => {
        return new Promise(async (resolve, reject) => {
            let vendor = await db.get().collection(collection.vendorcollection).findOne({ email: details.email })
            response = {}
            if (vendor) {
                response.vendorfound = true
                resolve(response)

            } else {
                details.pword = await bcrypt.hash(details.pword, 10);
                details.repeatpword = details.pword
                details.approved = false
                db.get().collection(collection.vendorcollection).insertOne(details).then((response) => {

                    response.vendorfound = false
                    resolve(response)
                })
            }
        })

    },

    vendorlogin: (vendordata) => {
        return new Promise(async (resolve, reject) => {

            let response = {}
            let vendor = await db.get().collection(collection.vendorcollection).findOne({ email: vendordata.email })

            if (vendor) {
                if (vendor.blocked) {
                    response.status = false
                    response.blocked = true
                    resolve(response)
                }
                bcrypt.compare(vendordata.pword, vendor.pword).then((state) => {
                    if (state) {
                        if (vendor.approved) {
                            response.status = true
                            response.vendorid = vendor._id
                            response.vendorname = vendor.vname
                            resolve(response)
                        } else {
                            response.status = false
                            response.notapproved = true
                            resolve(response)
                        }
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
    getvendor: (vendorId) => {
        return new Promise(async (resolve, reject) => {
            let vendor = await db.get().collection(collection.vendorcollection).findOne({ _id: ObjectId(vendorId) })
            resolve(vendor)
        })
    },
    updatevendor: (details) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.vendorcollection).updateOne({ _id: ObjectId(details.vendorId) }, {
                $set: { vname: details.vname, email: details.email, mobile: details.mobile, address: details.address }
            }).then(() => {
                resolve()
            })
        })

    },
    changepassword: (vendorId, details) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let vendor = await db.get().collection(collection.vendorcollection).findOne({ _id: ObjectId(vendorId) })
            bcrypt.compare(details.oldpword, vendor.pword).then(async (state) => {
                if (state) {
                    response.vendorpwordNoMatch = false
                    newpword = await bcrypt.hash(details.newpword, 10)
                    newrepeatpword = newpword
                    db.get().collection(collection.vendorcollection).updateOne({ _id: ObjectId(vendorId) },
                        {
                            $set: { pword: newpword, repeatpword: newrepeatpword }
                        }).then(() => {
                            resolve(response)
                        })
                }
                else {
                    response.vendorpwordNoMatch = true
                    resolve(response)
                }
            })
        })
    },
    getOrderedVendorProducts: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.orders).aggregate([
                { $match: { _id: { $exists: true } } },
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
                },
                {
                    $project: {
                        deliveryaddress: 1, paymentmethod: 1, total: 1, status: 1, date: 1, companyId: '$product.companyid', product: 1
                    }
                },
                {
                    $unwind: '$companyId'
                }
            ]).toArray()

            resolve(orders)
        })
    },
    changeOrderStatus: (orderId, state) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.orders).updateOne({ _id: ObjectId(orderId) },
                {
                    $set: {
                        status: state
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    addOffer: (details) => {
        response = {}

        return new Promise(async (resolve, reject) => {
            categoryofferExist = null
            productofferExist = null
            if (details.offercategory) {
                categoryofferExist = await db.get().collection(collection.offers).findOne({ offercategory: details.offercategory })
            } else {
                productofferExist = await db.get().collection(collection.offers).findOne({ offerproduct: details.offerproduct })
            }

            if (categoryofferExist) {

                response.categoryOfferExist = true
                resolve(response)
            } else if (productofferExist) {

                response.productOfferExist = true
                resolve(response)

            } else {
                if (details.offercategory) {
                    details.category = true
                    db.get().collection(collection.offers).insertOne(details).then(async () => {
                        await db.get().collection(collection.products).update({ category: details.offercategory, companyid: ObjectId(details.companyid) },
                            {
                                $set: { categorydiscount: details.discount }
                            })
                        resolve(response)
                    })
                } else {
                    details.product = true
                    db.get().collection(collection.offers).insertOne(details).then(async () => {
                        await db.get().collection(collection.products).update({ product: details.offerproduct, companyid: ObjectId(details.companyid) },
                            {
                                $set: { productdiscount: details.discount }
                            })
                        resolve(response)
                    })
                }

            }
        })
    },
    getoffers: (vendorId) => {
        response = {}
        return new Promise(async (resolve, reject) => {

            response.categoryoffers = await db.get().collection(collection.offers).find({ companyid: vendorId, category: true }).toArray()

            response.productoffers = await db.get().collection(collection.offers).find({ companyid: vendorId, product: true }).toArray()

            resolve(response)
        })
    },
    deleteOffer: (offerId) => {
        return new Promise(async (resolve, reject) => {
            let offer = await db.get().collection(collection.offers).findOne({ _id: ObjectId(offerId) })
            if (offer.offercategory) {
                await db.get().collection(collection.products).update({ category: offer.offercategory, companyid: ObjectId(offer.companyid) },
                    {
                        $unset: { categorydiscount: offer.discount }
                    })
            } else {
                await db.get().collection(collection.products).update({ product: offer.offerproduct, companyid: ObjectId(offer.companyid) },
                    {
                        $unset: { productdiscount: offer.discount }
                    })
            }
            db.get().collection(collection.offers).deleteOne({ _id: ObjectId(offerId) }).then(() => {
                resolve()
            })
        })
    },
    getVendorDashboardDetails: (vendorId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.orders).aggregate([

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
                }, {
                    $project: { deliveryaddress: 1, paymentmethod: 1, total: 1, status: 1, date: 1, product: 1, companyid: '$product.companyid' }
                },
                {
                    $lookup: {
                        from: collection.vendorcollection,
                        localField: 'companyid',
                        foreignField: '_id',
                        as: 'vendordetails'
                    }
                },
                {
                    $project: {
                        deliveryaddress: 1, paymentmethod: 1, total: 1, status: 1, date: 1,
                        productname: '$product.product',
                        category: '$product.category',
                        brand: '$product.brand',
                        vendors: '$vendordetails.vname',
                        companyid: '$product.companyid'
                    }
                }

            ]).toArray()


            today = new Date()
            currentMonth = today.getMonth()
            let count = 0
            January = [], February = [], March = [], April = [], May = [], June = [], July = [], August = [], September = [], October = [], November = [], December = []
            months = [January, February, March, April, May, June, July, August, September, October, November, December]
            for (let element of orders) {
                if (element.companyid[0].toString() === ObjectId(vendorId).toString()) {
                    count++
                    date = new Date(element.date);
                    date.setHours(5)
                    date.setMinutes(30)
                    month = date.getMonth()
                    for (i = 0; i <= 11; i++) {
                        if (month == i) {
                            months[i].push(element)

                        }
                    }
                }

            }

            revenueThisMonth = 0
            averageRevenuePerMonth = 0
            averagePurchasesPerMonth = parseFloat(count / 12)
            ordersThisMonth=[]
            MonthwiseRevenue = []



            for (let element of months) {
                totalAmountOfMonth = 0
                for (let order of element) {
                    totalAmountOfMonth = totalAmountOfMonth + parseInt(order.total)
                    if (currentMonth === months.indexOf(element)) {
                        ordersThisMonth.push(order)
                    }
                }
                MonthwiseRevenue.push(parseInt(totalAmountOfMonth))

                averageRevenuePerMonth = averageRevenuePerMonth + totalAmountOfMonth
                element.push({ 'totalAmountOfMonth': parseInt(totalAmountOfMonth) })
                if (currentMonth === months.indexOf(element)) {
                    revenueThisMonth = parseInt(totalAmountOfMonth)

                }
            }
            averageRevenuePerMonth = parseInt(averageRevenuePerMonth / 12)
            thisMonthOrders = ordersThisMonth.length


            response = { months: months, revenueThisMonth: revenueThisMonth, averageRevenuePerMonth: averageRevenuePerMonth, averagePurchasesPerMonth: averagePurchasesPerMonth, MonthwiseRevenue: MonthwiseRevenue , thisMonthOrders:thisMonthOrders}

            resolve(response)
        })
    }
}