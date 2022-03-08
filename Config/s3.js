const S3 = require('aws-sdk/clients/s3')
const fs = require('fs')
const AWS = require('aws-sdk');


const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const awsAccessKey = process.env.AWS_ACCESS_KEY
const awsSecretKey = process.env.AWS_SECRET_KEY


AWS.config.update({
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    "region": region   
});

const s3 = new S3() 

module.exports={
    upload:(file)=>{
        const fileStream = fs.createReadStream(file.path)
        
        const uploadParams = {
            Bucket : bucketName,
            Body :fileStream,
            Key : file.filename
    
        }
    
        return s3.upload(uploadParams).promise()
    }

}