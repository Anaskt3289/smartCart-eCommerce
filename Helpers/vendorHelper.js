var db = require('../Config/Connection')
var collection = require('../Config/Collection')
const async = require('hbs/lib/async')
const bcrypt=require('bcrypt')
const { reject } = require('bcrypt/promises')
const { ObjectId } = require('mongodb')


module.exports={
    addvendor:(details)=>{
        return new Promise(async(resolve,reject)=>{
            let vendor=await db.get().collection(collection.vendorcollection).findOne({email:details.email})
            response={}
            if(vendor){
                response.vendorfound=true
                resolve(response)

            }else{
            details.pword = await bcrypt.hash(details.pword,10);
            details.repeatpword = details.pword
            details.approved=false
            db.get().collection(collection.vendorcollection).insertOne(details).then((response)=>{

                response.vendorfound=false
                resolve(response)
            })
        }
        })
           
    },
   
    vendorlogin:(vendordata)=>{
        return new Promise(async (resolve,reject)=>{
            
            let response={}
            let vendor=await db.get().collection(collection.vendorcollection).findOne({email:vendordata.email})
            
            if(vendor){
                if(vendor.blocked){
                    response.status=false
                    response.blocked=true
                    resolve(response)
                }
                bcrypt.compare(vendordata.pword,vendor.pword).then((state)=>{
                    if(state){
                        if(vendor.approved){
                            response.status=true
                            response.vendorid=vendor._id
                            response.vendorname=vendor.vname
                            resolve(response)
                        }else{
                            response.status=false
                            response.notapproved=true
                            resolve(response)
                        }
                    }else{
                        response.status=false
                        response.blocked=false
                      resolve(response)
                    }
                })
            }else{
                response=false
                resolve(response)
            }
        })
    },
    getvendor:(vendorId)=>{
        return new Promise(async(resolve,reject)=>{
            let vendor= await db.get().collection(collection.vendorcollection).findOne({_id:ObjectId(vendorId)})
            resolve(vendor)
        })
    },
    updatevendor:(details)=>{
        return new Promise((resolve,reject)=>{
            
            db.get().collection(collection.vendorcollection).updateOne({_id:ObjectId(details.vendorId)},{
                $set:{vname:details.vname,email:details.email, mobile:details.mobile, address:details.address}}).then(()=>{
                    resolve()
                })
            })
      
    },
    changepassword:(vendorId,details)=>{
        let response={}
        return new Promise(async(resolve,reject)=>{
            let vendor= await db.get().collection(collection.vendorcollection).findOne({_id:ObjectId(vendorId)})
            bcrypt.compare(details.oldpword, vendor.pword).then(async(state)=>{
                if(state){
                    response.vendorpwordNoMatch=false
                    newpword = await bcrypt.hash(details.newpword, 10)
                    newrepeatpword = newpword
                    db.get().collection(collection.vendorcollection).updateOne({_id:ObjectId(vendorId)},
                    {
                        $set:{pword:newpword,repeatpword:newrepeatpword}
                    }).then(()=>{
                        resolve(response)
                    })
                }
                else{
                    response.vendorpwordNoMatch=true
                    resolve(response)
                }
            })
        })
    }
}