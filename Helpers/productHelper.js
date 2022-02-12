var db = require('../Config/Connection')
var collection = require('../Config/Collection')
const async = require('hbs/lib/async')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
    addproduct: (details) => {
        let prodObj = {
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
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.products).findOne({ product: details.product, companyid: ObjectId(details.companyid) })
            response = {}
            if (product) {
                response.productfound = true
                resolve(response)

            } else {
                details.quantity = parseInt(details.quantity)
                details.price = parseInt(details.price)
                db.get().collection(collection.products).insertOne(prodObj).then((response)=>{

                    response.productfound = false
                    resolve(response)
                })
            }
        })
    },
    getproducts: (cmpid) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.products).find({ companyid: ObjectId(cmpid) }).toArray();
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
            details.price=parseInt(details.price)
            details.quantity=parseInt(details.quantity)
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
    productsinBuyNow:(productid)=>{
        return new Promise(async(resolve, reject) => {
          let products= await db.get().collection(collection.products).find({ _id: ObjectId(productid) }).toArray()
                resolve(products)
           
        })
    }
}