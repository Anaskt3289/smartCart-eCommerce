var db = require('../Config/Connection')
var collection = require('../Config/Collection')
const async = require('hbs/lib/async')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
    addproduct: async (details) => {
        let categoryOffer = await db.get().collection(collection.offers).findOne({ offercategory: details.category })
        if (categoryOffer) {
            prodObj = {
                product: details.product,
                category: details.category,
                brand: details.brand,
                quantity: parseInt(details.quantity),
                price: parseInt(details.price),
                stock: details.stock,
                description: details.description,
                companyid: ObjectId(details.companyid),
                specs: details.specs,
                categorydiscount:categoryOffer.discount

            }
        } else {
            prodObj = {
                product: details.product,
                category: details.category,
                brand: details.brand,
                quantity: parseInt(details.quantity),
                price: parseInt(details.price),
                stock: details.stock,
                description: details.description,
                companyid: ObjectId(details.companyid),
                specs: details.specs
            }
        }
      
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.products).findOne({ product: details.product, companyid: ObjectId(details.companyid) })
            response = {}
            if (product) {
                response.productfound = true
                resolve(response)

            } else {
                details.quantity = parseInt(details.quantity)
                details.price = parseInt(details.price)
                db.get().collection(collection.products).insertOne(prodObj).then((response) => {

                    response.productfound = false
                    resolve(response)
                })
            }
        })
    },
    getproducts: (cmpid) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.products).find({ companyid: ObjectId(cmpid) }).toArray();
            for(let element of products){
                if(element.quantity===0){
                    element.stock='Out of stock'
                }else{
                    element.stock='In stock'
                }
            }
            resolve(products)
        })

    },
    deleteproduct: (productid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.products).remove({ _id: ObjectId(productid) })
        })
    },
    getoneproduct: (productid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.products).findOne({ _id: ObjectId(productid) }).then((product) => {
                discountDetails = {}

                if (product.categorydiscount && product.productdiscount) {
                    categorydiscount = parseInt(product.categorydiscount)
                    productdiscount = parseInt(product.productdiscount)

                    discountDetails.discount = (categorydiscount > productdiscount) ? categorydiscount : productdiscount
                    discountDetails.discountedamount = (product.price) * discountDetails.discount / 100
                    discountDetails.currentprice = (product.price) - discountDetails.discountedamount
                    product.discountDetails = discountDetails

                } else if (product.categorydiscount) {
                    categorydiscount = parseInt(product.categorydiscount)

                    discountDetails.discount = categorydiscount
                    discountDetails.discountedamount = (product.price) * discountDetails.discount / 100
                    discountDetails.currentprice = (product.price) - discountDetails.discountedamount
                    product.discountDetails = discountDetails



                } else if (product.productdiscount) {
                    productdiscount = parseInt(product.productdiscount)

                    discountDetails.discount = productdiscount
                    discountDetails.discountedamount = (product.price) * discountDetails.discount / 100
                    discountDetails.currentprice = (product.price) - discountDetails.discountedamount
                    product.discountDetails = discountDetails



                }
                resolve(product)
            })
        })
    },
    findid: (details) => {
        return new Promise(async (resolve, reject) => {
            product = await db.get().collection(collection.products).findOne({ product: details.product, companyid: ObjectId(details.companyid) })
            response.id = product._id
            resolve(response)
        })
    },
    updateproduct: (productid, details) => {
        return new Promise((resolve, reject) => {
            details.price = parseInt(details.price)
            details.quantity = parseInt(details.quantity)
            db.get().collection(collection.products).updateOne({ _id: ObjectId(productid) },
                {
                    $set: {
                        product: details.product, category: details.category, brand: details.brand, quantity: details.quantity,
                        price: details.price, stock: details.stock, description: details.description, companyid: ObjectId(details.companyid), specs: details.specs
                    }
                }
            ).then((response) => {
                resolve(response)
            })
        })
    },
    productsinBuyNow: (productid) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.products).find({ _id: ObjectId(productid) }).toArray()
            resolve(products)

        })
    }
}