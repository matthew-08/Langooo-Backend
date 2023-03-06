const redisClient = require('../redis').redisClient


module.exports.authorizeUser = (socket, next) => {
    console.log(socket)
    console.log('in socket')
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
