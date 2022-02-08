var db = require('../Config/Connection')
var collection = require('../Config/Collection')
const async = require('hbs/lib/async')
const bcrypt=require('bcrypt')
const { reject } = require('bcrypt/promises')


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
    }
}