//@ts-nocheck
const Redis = require('ioredis');

const redisClient = new Redis();

const userOnline = async (userId) => {
    const checkOnline = await redisClient.exists(`${userId}`)
    if(checkOnline) {
        return true
    }
    else {
        return false
    }
}

const logOutUser = async (userid) => {
    const checkUser = await userOnline(userid)

    if(checkUser) {
        redisClient.del(`${userid}`)
    }
}

module.exports = {redisClient, userOnline, logOutUser};