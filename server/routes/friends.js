const router = require('express').Router()
const pool = require('../db')
const redisClient = require('../redis')


router.post('/sendMessage', async (req, res) => {
    const { sender, recipient, date, content, conversationId } = req.body

    // 
    if(conversationId) {
        // If there's a conversation id that we've already sent to the front end.
        // go ahead and just insert the into the database.
        const insertMessage = await pool.query('INSERT INTO message (conversation, sender, content, time) VALUES($1, $2, $3, $4)', [conversationId, sender, content, date])
        return res.json(insertMessage);
    }
   

    //we don't have an existing conversation between these two users/
    // Create a new conversation with the recipient and sender
    const createNewConversation = await pool.query('INSERT INTO conversation (userId1, userId2) VALUES($1, $2) RETURNING id', [sender, recipient])
    
    const returnedConvoId = createNewConversation.rows[0].id


    // we created a new conversation, now we'll need to insert thse message into the conversation
     const createNewMessage = await pool.query('INSERT INTO message (conversation, sender, content, time) VALUES($1, $2, $3, $4)', [returnedConvoId, sender, content, date])

    
    return res.status(200).json(createNewMessage)
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

router.post('/newMessage/', async (req, res) => {
    console.log(req.body);
    const {
        sender,
        time,
        content,
        conversationId,

    } = req.body

    const insertMessage = await pool.query('INSERT INTO message(conversation, sender, content, time) VALUES($1, $2, $3, $4)', [conversationId, sender, content, time])
    return res.status(200);
})  

module.exports = router