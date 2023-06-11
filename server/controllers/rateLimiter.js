const redisClient = require('../redis').redisClient

module.exports = async (req, res, next) => {
    console.log(req)
    const ip = req.connection.remoteAddress
    const response = await redisClient.multi().incr(ip).expire(ip, 60).exec();
    if(response[1] > 10) {
        res.json({loggedIn: false, status: 'Too many requests'})
    }
    next();
}