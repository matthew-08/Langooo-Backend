//@ts-nocheck
const Redis = require('ioredis');

const redisClient = new Redis();

const userOnline = async (userId) => {
    console.log(userId);
    const checkOnline = await redisClient.exists(`${userId}`)
    console.log(checkOnline);
    if(checkOnline) {
        console.log('its true')
        console.log(checkOnline)
        return true
    }
    else {
        return false
    }
}

module.exports = {redisClient, userOnline};