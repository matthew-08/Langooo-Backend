const session = require('express-session')
const RedisStore = require('connect-redis').default
const redisClient = require('../redis').redisClient


const ok = 'true'
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    cookie: {
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
        sameSite: 'none',
        secure: true,
    },
    credentials: true,
    name: 'sid',
    store: new RedisStore({ client: redisClient } ),
    resave: false,
    saveUninitialized: true,
})

module.exports = { sessionMiddleware }