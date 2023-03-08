const router = require('express').Router()
const pool = require('../db')
const redisClient = require('../redis').redisClient


router.post('/sendMessage', async (req, res) => {
    const {timestamp, userId, conversationId, content} = req.body
        // If there's a conversation id that we've already sent to the front end.
        // go ahead and just insert the into the database.
        const insertMessage = await pool.query(`
        INSERT INTO message 
        (conversation, sender, content, time) 
        VALUES($1, $2, $3, $4)`, 
        [conversationId, userId, content, timestamp])
        return res.status(200).json(insertMessage);
})

router.get('/conversationList/:id', async (req, res) => {
    const { id: userId } = req.params;

    const getAllConvoId = await pool.query(
        `SELECT users.id, users.username, conversation.id AS conversation_id FROM conversation
         JOIN users ON conversation.userId2=users.id WHERE conversation.userId1 = $1
         UNION
         SELECT users.id, users.username, conversation.id FROM conversation
         JOIN users ON conversation.userId1=users.id WHERE conversation.userId2 = $1
        `, [userId]
    )
    const result = await (getAllConvoId.rows)
    return res.json(result)
})

router.get('/conversation/:id', async(req, res) => {
    const { id: conversationId } = req.params

    const getConversation = await pool.query(`
    SELECT * FROM message WHERE conversation = $1
    `, [conversationId]);

    return res.json(getConversation.rows);

})

router.get('/users', async(req, res) => {
    const getAllUsers = await pool.query('SELECT username, id FROM users')

    const allUsers = getAllUsers.rows

    for(const user of allUsers) {
        const { id: userId } = user
        const checkOnline = await redisClient.exists(`${userId}`)
        if(checkOnline) {
            user.online = true
        }
        else {
            user.online = false
        }
    }
    return res.json(allUsers);
})

router.get('/latestMessage/:id', async(req, res) => {
    const {id: conversationId} = req.params
    const mostRecentMessage = await pool.query('SELECT * from message WHERE conversation = $1 ORDER BY time DESC LIMIT 1', [conversationId])
    return res.json(mostRecentMessage.rows[0])
})

router.post('/addConvo/:id1/:id2', async (req, res) => {
    const currentUserId = req.session.user.userId
    const { id1:userOne, id2:userTwo } = req.params
    console.log(currentUserId)
    console.log(userOne)

    const checkForExisting = await pool.query(`
    SELECT * FROM conversation
    WHERE userid1 = $1 AND userid2 = $2
    OR
    userid2 = $1 AND userid1 = $2 
    `, [userOne, userTwo])
    if(checkForExisting.rowCount !== 0) {
        return res.status(404).json({ status: 'conversation already exists'})
    }
    const addConvo = await pool.query(`
        INSERT INTO conversation(userid1, userid2)
        VALUES($1, $2)
        RETURNING *
    `, [userOne, userTwo])
    
    const { id: conversationId, userid1, userid2 } = addConvo.rows[0]

    const adjustConvoShema = {
        userId: userid1 === currentUserId ? userid2 : userid1,
        conversationId, 
    } 

    return res.status(200).json(adjustConvoShema)
})

router.post('/newMessage/', async (req, res) => {
    const {
        sender,
        time,
        content,
        conversationId,

    } = req.body

    const insertMessage = await pool.query('INSERT INTO message(conversation, sender, content, time) VALUES($1, $2, $3, $4)', [conversationId, sender, content, time])
    return res.status(200);
})  

router.get('/getAllMessages/:id', async (req, res) => {
    const { id: convoId } = req.params
    
    if(!convoId) {
        return res.status(404).end()
    }

    const messages = await pool.query(`
    SELECT * FROM message WHERE
    conversation = $1
    `, [convoId])

    if (messages.rowCount === 0) {
        return res.status(200).json([])
    }

    const adjustMessagesSchema = messages.rows.map(message => {
        return {
            content: message.content,
            timestamp: message.time,
            userId: message.sender
        }
    })

    return res.status(200).json(adjustMessagesSchema)

})

module.exports = router