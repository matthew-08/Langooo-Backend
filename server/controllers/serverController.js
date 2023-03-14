const session = require('express-session')
const RedisStore = require('connect-redis').default
const redisClient = require('../redis').redisClient



const sessionMiddleware = session({
    secret: 'a secret key',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: 'lax'
    },
    credentials: true,
    name: 'sid',
    store: new RedisStore({ client: redisClient }),
    resave: false,
    saveUninitialized: false,
})

module.exports = { sessionMiddleware }