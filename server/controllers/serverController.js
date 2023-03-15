const session = require('express-session')
const RedisStore = require('connect-redis').default
const redisClient = require('../redis').redisClient



const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
    },
    credentials: true,
    name: 'sid',
    store: new RedisStore({ client: redisClient }),
    resave: false,
    saveUninitialized: false,
})

module.exports = { sessionMiddleware }