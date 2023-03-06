//@ts-nocheck
const Redis = require('ioredis');

const redisClient = new Redis();

const userOnline = async (userId) => {
    console.log(userId);
    const checkOnline = await redisClient.exists(`${userId}`)
    console.log(checkOnline);
    if(checkOnline) {
        console.log('inside checkonline')
        console.log(checkOnline)
        return true
    }
    else {
        console.log('inside checkonline')
        console.log(checkOnline)
        return false
    }
}

module.exports = {redisClient, userOnline};