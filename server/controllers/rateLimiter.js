const redisClient = require('../redis')

module.exports = async (req, res, next) => {

    const ip = req.connection.remoteAddress
    const response = await redisClient.multi().incr(ip).expire(ip, 60).exec();
    console.log(response);
    if(response[1] > 10) {
        res.json({loggedIn: false, status: 'Too many requests'})
    }
    next();
}