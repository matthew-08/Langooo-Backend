const pool = require('../db')
const router = require('express').Router()


router.get('/user/:id', (req, res) => {
    const { id: userId } = req.params

    pool.query(`
    SELECT username, native_lang,     
    
    `)
})

router.get('/allConvos/:id', async (req, res) => {
    const { id: userId } = req.params

    const conversations = await pool.query(`
    SELECT id, userid1 AS user_id 
    FROM conversation 
    WHERE userid2 = $1
    UNION
    SELECT id, userid2 AS user_id
    FROM conversation
    WHERE userid1 = $1
    `,[userId])

    if(conversations.rowCount === 0) {
        return res.status(200).json([])
    }
    
    const allUserConvos = conversations.rows.map(convo => {
        return {
            convoId: convo.id,
            userId: convo.user_id
        }
    })

    return res.status(200).json(allUserConvos);
    
})

module.exports = router