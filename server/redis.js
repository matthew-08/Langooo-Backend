//@ts-nocheck
const Redis = require('ioredis');

const redisClient = new Redis({
    port: process.env.REDISPORT, // Redis port
    host: process.env.REDISHOST, // Redis host
    username: process.env.REDISUSER, // needs Redis >= 6
    password: process.env.REDISPASSWORD,
    db: 0, // Defaults to 0
  });

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