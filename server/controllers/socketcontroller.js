const redisClient = require('../redis')


module.exports.authorizeUser = (socket, next) => {
     if(!socket.request.session || !socket.request.session.user) {
        console.log('bad req')
        next(new Error('not authorized'))
    }
    else {
        socket.user = {...socket.request.session.user}
        next();
    }
}

module.exports.addFriends = (socket) => {

}
