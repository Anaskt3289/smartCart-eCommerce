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
    getusers:()=>{
        return new Promise(async(resolve,reject)=>{
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
    getbanners:()=>{
        return new Promise(async(resolve,reject)=>{
            let banners = await db.get().collection(collection.banners).find({}).toArray()
            resolve(banners)
        })
    },
    getOneBanner:(bannerId)=>{
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
                   banner:details.banner,description1:details.description1,description2:details.description2,
                   btnname:details.btnname,btnurl:details.btnurl
                }
            }
        ).then((response) => {
            resolve(response)
        })
    })
}
}