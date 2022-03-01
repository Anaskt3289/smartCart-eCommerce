var db = require('../Config/Connection')
var collection = require('../Config/Collection')
const async = require('hbs/lib/async')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')







module.exports = {
    adminlogin: (admindata) => {
        return new Promise(async (resolve, reject) => {

            let resp = {}
            let admin = await db.get().collection(collection.admincollection).findOne({ email: admindata.email })
            if (admin) {
                bcrypt.compare(admindata.pword, admin.pword).then((adminstate) => {
                    if (adminstate) {
                        resp = true
                        resolve(resp)
                    } else {
                        resp = false
                        resolve(resp)
                    }
                })
            } else {
                resp = false
                resolve(resp)
            }
        })
    },
    showvendors: () => {
        return new Promise(async (resolve, reject) => {
            let vendors = await db.get().collection(collection.vendorcollection).find({ approved: true }).toArray();
            resolve(vendors)
        })

    },
    deletevendor: (vendorid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.vendorcollection).remove({ _id: ObjectId(vendorid) }).then(() => {
                resolve()
            })
        })
    },
    blockvendor: (vendorid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.vendorcollection).updateOne({ _id: ObjectId(vendorid) }, { $set: { blocked: true } }).then((response) => {

                resolve(response)
            })
        })
    },
    unblockvendor: (vendorid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.vendorcollection).updateOne({ _id: ObjectId(vendorid) }, { $unset: { blocked: true } }).then((response) => {
                resolve(response)
            })
        })
    },
    vendorrequests: () => {
        return new Promise(async (resolve, reject) => {
            let vendors = await db.get().collection(collection.vendorcollection).find({ approved: false }).toArray();
            resolve(vendors)
        })
    },
    acceptvendor: (vendorid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.vendorcollection).updateOne({ _id: ObjectId(vendorid) }, { $set: { approved: true } })
        })
    },
    getusers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.usercollection).find({}).toArray()
            resolve(users)
        })
    },
    deleteuser: (userid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.usercollection).remove({ _id: ObjectId(userid) }).then(() => {
                resolve()
            })
        })
    },
    blockuser: (userid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.usercollection).updateOne({ _id: ObjectId(userid) }, { $set: { blocked: true } }).then((response) => {

                resolve(response)
            })
        })
    },
    unblockuser: (userid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.usercollection).updateOne({ _id: ObjectId(userid) }, { $unset: { blocked: true } }).then((response) => {
                resolve(response)
            })
        })
    },
    getbanners: () => {
        return new Promise(async (resolve, reject) => {
            let banners = await db.get().collection(collection.banners).find({}).toArray()
            resolve(banners)
        })
    },
    getOneBanner: (bannerId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.banners).findOne({ _id: ObjectId(bannerId) }).then((banner) => {
                resolve(banner)
            })
        })
    },
    updatebanner: (bannerId, details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.banners).updateOne({ _id: ObjectId(bannerId) },
                {
                    $set: {
                        banner: details.banner, description1: details.description1, description2: details.description2,
                        btnname: details.btnname, btnurl: details.btnurl
                    }
                }
            ).then((response) => {
                resolve(response)
            })
        })
    },
    addCategory: (category) => {
        response = {}

        return new Promise(async (resolve, reject) => {
            let cat = await db.get().collection(collection.categories).findOne({ category: category })


            if (cat) {
                response.categoryExist = true
                resolve(response)
            } else {
                db.get().collection(collection.categories).updateOne({}, { $push: { category: category } }, { upsert: true }).then(() => {
                    resolve(response)
                    response.categoryExist = false
                })
            }
        })
    },
    deleteCategory: (categorytoDelete) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.categories).updateOne({}, { $pull: { category: { category: categorytoDelete } } }).then(() => {
                resolve()
            })
        })
    },

    addBrand: (brand) => {
        response = {}
        console.log(brand);
        return new Promise(async (resolve, reject) => {
            let Brand = await db.get().collection(collection.brands).findOne({ brand: brand })
            if (Brand) {
                response.brandExist = true
                resolve(response)
            } else {

                response.brandExist = false
                db.get().collection(collection.brands).updateOne({}, { $push: { brand: brand } }, { upsert: true }).then(() => {
                    resolve(response)
                })
            }
        })
    },

    deleteBrand: (brandtoDelete) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.brands).updateOne({}, { $pull: { brand: { brand: brandtoDelete } } }).then(() => {
                resolve()
            })
        })
    },


    getCategoryBrandProducts: () => {
        return new Promise(async (resolve, reject) => {
            response = {}
            let category = await db.get().collection(collection.categories).find({}).toArray()
            let brand = await db.get().collection(collection.brands).find({}).toArray()

            if (category.length != 0) {
                response.category = category[0].category
            }
            if (brand.length != 0) {
                response.brand = brand[0].brand
            }
            resolve(response)
        })
    },
    addcoupon: (details, authorizerId) => {

        couponObj = {
            authorizer: authorizerId,
            couponcode: details.couponcode,
            discount: details.discount,
            expirydate: details.expirydate
        }


        response = {}
        return new Promise(async (resolve, reject) => {
            let couponExist = await db.get().collection(collection.coupons).findOne({ couponcode: details.couponcode })
            if (couponExist) {
                response.couponExist = true
                resolve(response)
            } else {
                db.get().collection(collection.coupons).insertOne(couponObj).then(() => {
                    response.couponExist = false
                    resolve(response)
                })
            }

        })
    },
    getCoupons: (authorizer) => {

        return new Promise(async (resolve, reject) => {
            let admincoupons = await db.get().collection(collection.coupons).find({ authorizer: authorizer }).toArray()

            let date = Date.now();
            nonexpiredCoupons = []
            for (let element of admincoupons) {
                if (new Date(element.expirydate) < date) {
                    await db.get().collection(collection.coupons).deleteOne({ _id: element._id })
                } else {
                    nonexpiredCoupons.push(element)
                }
            }
            resolve(nonexpiredCoupons)
            console.log(nonexpiredCoupons);
        })

    },
    deleteCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.coupons).deleteOne({ _id: ObjectId(couponId) }).then(() => {
                resolve()
            })
        })
    },
    getUserCount: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collection.usercollection).find().count()
            resolve(count)
        })
    },
    getVendorCount: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collection.vendorcollection).find().count()
            resolve(count)
        })
    },
    getOrderDetails: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.orders).find().toArray()
            let count = orders.length

            today = new Date()
            currentMonth = today.getMonth()

            January = [], February = [], March = [], April = [], May = [], June = [], July = [], August = [], September = [], October = [], November = [], December = []
            months = [January, February, March, April, May, June, July, August, September, October, November, December]
            for (let element of orders) {
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
            totalThisMonth = 0
            averageProfitPerMonth = 0
            averagePurchasesPerMonth = parseFloat(count / 12)
            productsThisMonth = []
            MonthwiseProfits = []



            for (let element of months) {
                totalAmountOfMonth = 0
                for (let order of element) {
                    totalAmountOfMonth = totalAmountOfMonth + parseInt(order.total)
                    if (currentMonth === months.indexOf(element)) {
                        productsThisMonth.push(order)
                    }
                }
                MonthwiseProfits.push(parseInt(totalAmountOfMonth * 7 / 100))

                averageProfitPerMonth = averageProfitPerMonth + totalAmountOfMonth
                element.push({ 'totalAmountOfMonth': parseInt(totalAmountOfMonth * 7 / 100) })
                if (currentMonth === months.indexOf(element)) {
                    totalThisMonth = parseInt(totalAmountOfMonth * 7 / 100)

                }
            }
            averageProfitPerMonth = parseInt((averageProfitPerMonth * 7 / 100) / 12)
            thisMonthproducts = productsThisMonth.length

            response = { months: months, totalThisMonth: totalThisMonth, count: count, averageProfitPerMonth: averageProfitPerMonth, averagePurchasesPerMonth: averagePurchasesPerMonth, thisMonthproducts: thisMonthproducts, MonthwiseProfits: MonthwiseProfits }

            resolve(response)
        })
    },


    getTopSelling: (vendorId) => {
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collection.categories).find().toArray()
            if (vendorId === 'admin') {
                orders = await db.get().collection(collection.orders).aggregate([

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
                        $project: { product: 1, companyid: '$product.companyid' }
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
                            productname: '$product.product',
                            category: '$product.category',
                            brand: '$product.brand',
                            vendors: '$vendordetails.vname',

                        }
                    }

                ]).toArray()




            } else {
                orders = await db.get().collection(collection.orders).aggregate([

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
                        $project: { product: 1, companyid: '$product.companyid' }
                    },
                    {
                        $match: { companyid: vendorId }
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
                            productname: '$product.product',
                            category: '$product.category',
                            brand: '$product.brand',
                            vendors: '$vendordetails.vname',

                        }
                    }

                ]).toArray()

            }


            topsellingCat = []

            for (let categoryname of categories[0].category) {
                let count = 0

                for (let order of orders) {

                    if (categoryname.category === order.category[0]) {
                        count++
                    }


                }

                topsellingCat.push({ category: categoryname.category, count: count })
            }


            topsellingCat.sort((a, b) => {
                return b.count - a.count;
            });


            for (i = 0; i < orders.length; i++) {
                productcount = 1;
                productmaxcount = 0
                for (j = i + 1; j < orders.length; j++) {
                    if (orders[i].productname[0] === orders[j].productname[0]) {
                        productcount++
                        orders[j].productname[0] = null
                    }
                }
                if (productcount > productmaxcount && orders[i].productname[0] != null) {
                    productmaxcount = productcount;
                    maxproduct = orders[i].productname[0]
                }
            }

            for (i = 0; i < orders.length; i++) {
                brandcount = 1;
                brandmaxcount = 0
                for (j = i + 1; j < orders.length; j++) {
                    if (orders[i].brand[0] === orders[j].brand[0]) {
                        brandcount++
                        orders[j].brand[0] = null
                    }
                }
                if (brandcount > brandmaxcount && orders[i].brand[0] != null) {
                    brandmaxcount = brandcount;
                    maxbrand = orders[i].brand[0]
                }
            }


            for (i = 0; i < orders.length; i++) {
                vendorcount = 1;
                vendormaxcount = 0
                for (j = i + 1; j < orders.length; j++) {
                    if (orders[i].vendors[0] === orders[j].vendors[0]) {
                        vendorcount++
                        orders[j].vendors[0] = null
                    }
                }
                if (vendorcount > vendormaxcount && orders[i].vendors[0] != null) {
                    vendormaxcount = vendorcount;
                    maxvendor = orders[i].vendors[0]
                }
            }



            resolve({ topsellingCat: topsellingCat, maxproduct: maxproduct, maxbrand: maxbrand, maxvendor: maxvendor })

        })
    },
    recentOrders: () => {
        return new Promise(async (resolve, reject) => {
            let recentOrders = await db.get().collection(collection.orders).aggregate([

                { $unwind: '$products' },
                {
                    $project: {
                        total: 1, status: 1, date: 1,
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
                    $project: { total: 1, status: 1, date: 1, product: 1, companyid: '$product.companyid' }
                },
                {
                    $lookup: {
                        from: collection.vendorcollection,
                        localField: 'companyid',
                        foreignField: '_id',
                        as: 'vendors'
                    }
                },
                {
                    $project: {
                        total: 1, status: 1, date: 1,
                        productname: '$product.product',
                        vendors: '$vendors.vname'
                    }
                }
            ]).sort({ _id: -1 }).limit(10).toArray()

            for (let element of recentOrders) {
                element.profit = parseInt((element.total * 7) / 100)
            }

            resolve(recentOrders)


        })
    },

    getSalesReport: (dates) => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.orders).aggregate([
                {
                    $project: {
                        date: 1, total: { $toInt: '$total' }
                    }
                },
                {
                    $group: {
                        _id: '$date',
                        totalAmountofDay: { $sum: '$total' },
                        count: { $count: {} }
                    }
                }
            ]).toArray()

            sales = []
            for (let element of details) {
                date = new Date(element._id)
                date.setHours(5)
                date.setMinutes(30)
                date.setSeconds(0)
                date.setMilliseconds(0)

                element.profit = parseInt((element.totalAmountofDay * 7) / 100)
                if (date >= new Date(dates.from) || date <= new Date(dates.to)) {
                    sales.push(element)
                }
            }



            datesbetween = []
            let dateFrom = new Date(dates.from)
            let dateTo = new Date(dates.to)

            currentdate = new Date(dateFrom)
            while (currentdate <= dateTo) {
                datesbetween.push(currentdate);
                currentdate = new Date(
                    currentdate.getFullYear(),
                    currentdate.getMonth(),
                    currentdate.getDate() + 1,
                    currentdate.getHours(),
                    currentdate.getMinutes()
                );
            }
            
            let salesreport = []
            for (let dates of datesbetween) {
                flag = 0
                for (let salesdate of sales) {
                    dateSale = new Date(salesdate._id)
                    dateSale.setHours(5)
                    dateSale.setMinutes(30)
                    if(dates.getTime() === dateSale.getTime()){
                        console.log(dates.getDate());
                        if(dates.getDate()<10){
                            formattedDate = "0"+dates.getDate()+"-"+(dates.getMonth()+1)+"-"+dates.getFullYear()
                        }else{

                            formattedDate = dates.getDate()+"-"+(dates.getMonth()+1)+"-"+dates.getFullYear()
                        }
                        salesreport.push({date:formattedDate,count:salesdate.count,totalAmountofDay:salesdate.totalAmountofDay,profit:salesdate.profit})
                     flag=1
                  }
                }
                if(flag===0){
                    if(dates.getDate()<10){
                        formattedDate = "0"+dates.getDate()+"-"+(dates.getMonth()+1)+"-"+dates.getFullYear()
                    }else{

                        formattedDate = dates.getDate()+"-"+(dates.getMonth()+1)+"-"+dates.getFullYear()
                    }
                   
                    salesreport.push({date:formattedDate,count:0,totalAmountofDay:0,profit:0})
                }
            }
           resolve(salesreport)
        })
    },

    getUserReport:()=>{
        return new Promise(async(resolve,reject)=>{
            let users = await db.get().collection(collection.usercollection).find().toArray()
            let orders = await db.get().collection(collection.orders).find().toArray()

            let userReport = []
            for(let user of users){
                count = 0 
                totalAmount = 0
                for(let order of orders){
                    if(user._id+"" === order.user+""){
                        count ++
                        totalAmount = totalAmount + parseInt(order.total)
                    }
                }
                userReport.push({user:user.fname,mobile:user.mobile,email:user.email,count:count,totalAmount:totalAmount})
            }
            resolve(userReport)
        })
    },
    getVendorReport:()=>{
        return new Promise(async(resolve,reject)=>{
            let vendors = await db.get().collection(collection.vendorcollection).find().toArray()
          
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
                    $project: { product: 1, total: 1, companyid: '$product.companyid' }
                }
            ]).toArray()

            let vendorReport = []
            for(let vendor of vendors){
                count = 0 
                totalAmount = 0
                for(let order of orders){
                    if(vendor._id+"" === order.companyid+""){
                        count ++
                        totalAmount = totalAmount + parseInt(order.total)
                    }
                }
                vendorReport.push({vendor:vendor.vname,mobile:vendor.mobile,email:vendor.email,count:count,totalAmount:totalAmount})
            }
            resolve(vendorReport)

        })
    },
    disableOrEnableproduct:(productId,type)=>{
        return new Promise((resolve,reject)=>{
            if(type==='disable'){
                db.get().collection(collection.products).updateOne({_id:ObjectId(productId)},
                {
                    $set:{disabled:true}
                }).then(()=>{
                    resolve()
                })

            }else{
                db.get().collection(collection.products).updateOne({_id:ObjectId(productId)},
                {
                    $unset:{disabled:true}
                }).then(()=>{
                    resolve()
                })
            }
        })
    }


}