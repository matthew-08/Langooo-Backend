const express = require('express')
const cors = require('cors')
const { Server } = require('socket.io')
const helmet = require('helmet')
const http = require('http')
const session = require('express-session')
require('dotenv').config()
const sessionMiddleware = require('./controllers/serverController').sessionMiddleware
const authorizeMiddleware = require('./controllers/socketcontroller').authorizeUser

const app = express()

const server = http.createServer(app)

const redisClient = require('./redis').redisClient

const io = new Server(server, {
    cors: {
        credentials: true,
        origin: process.env.FRONTEND_URL
    }

})
app.set('trust proxy', 1);

app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
    exposedHeaders: ["set-cookie"]
}))

io.engine.use(sessionMiddleware);
io.use(authorizeMiddleware);
app.use(sessionMiddleware)

io.on('connect', async socket => {
    const ok = await redisClient.set(
        `${socket.request.session.user.userId}`, `${socket.id}`, 'EX', 1000,
    )
    const hello = await redisClient.ttl(`${socket.request.session.user.id}`).then(res => console.log(res))
    
    const check = await redisClient.exists(`${socket.request.user}`)
    
    socket.on('disconnect', async () => {
        const userId = socket.request.session.user.id
        await redisClient.del(`${userId}`, 'connected').then(res => console.log(res));
    })

    socket.on('private_chat', async (data) => {
        const userSocket = await redisClient.get(data.to)
        const response = {
            message: data.message,
            conversationId: data.conversationId
        }
        if(userSocket) {
           io.to(userSocket).emit('chat_message', response)
        }
    })
    socket.on('edit_message', async (data) => {
        const userSocket = await redisClient.get(data.to)
        const response = {
            message: data.message,
            conversationId: data.conversationId
        }
        if(userSocket) {
            io.to(userSocket).emit('on_edit', response)
        }
    })
    socket.on('msg_delete', async (data) => {
        const userSocket = await redisClient.get(data.to)
        console.log(data)
        const response = {
            message: data.message,
            conversationId: data.conversationId
        }
        if(userSocket) {
            io.to(userSocket).emit('on_delete', response)
        }
    })
})





app.use(helmet())

app.use(express.json())

app.use('/auth', require('./routes/auth'))

app.use('/userInfo', require('./routes/userInfo'))

app.use('/convo', require('./routes/friends'))

server.listen(`${process.env.PORT}`)

