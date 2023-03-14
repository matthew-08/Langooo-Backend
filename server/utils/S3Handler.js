const multer = require('multer')
const { 
    S3Client, 
    PutObjectCommand, 
    GetObjectCommand,
} = require("@aws-sdk/client-s3")
const randomBytes = require('randombytes');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");



const bucketName = process.env.BUCKET_NAME
const bucketLocation = process.env.BUCKET_LOCATION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY


const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: bucketLocation,
})

const postImg = async function(file) {
    const randomImgName = randomBytes(32).toString('hex')
    const params = {
        Bucket: bucketName,
        Key: randomImgName,
        Body: file.buffer,
        ContentType: file.mimetype,
    }
    const command = new PutObjectCommand(params)
    await s3.send(command)
    return randomImgName
}

const getImg = async function(imgId) {
    const getObjectParams = {
        Bucket: bucketName,
        Key: imgId
    }

    const command = new GetObjectCommand(getObjectParams)
    const url = await getSignedUrl(s3, command, { expiresIn: 604800,})
    .then(r => r);
    return await url
}



module.exports = { postImg, getImg }