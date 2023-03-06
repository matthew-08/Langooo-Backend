const pool = require('../db')
const router = require('express').Router()


router.get('/allUsers/', async (req, res) => {
    const userId = req.session.user.userId
    console.log(req.session.user.userId)

    const queryUsers = (await pool.query(`
    SELECT users.id, username, native_lang, user_img,
    users.bio, language.name AS user_language
    FROM users
    JOIN
    user_language
    ON users.id = user_language.user_id
    JOIN language
    ON user_language.language_id = language.id
    WHERE users.id != $1
    `, [userId])).rows
    await console.log(queryUsers)

    const languages = {
        1: 'french',
        2: 'japanese',
        3: 'vietnamese',
        4: 'chinese',
        5: 'english'
    }

    const reduceUsers = queryUsers.reduce((acc, queryUsers) => {
        const findExisting = acc.find(({userId}) => userId === queryUsers.id)
        if(findExisting) {
            findExisting.learningLanguages.push(queryUsers.user_language)
        }
        else {
            acc.push({
                userId: queryUsers.id,
                username: queryUsers.username,
                nativeLanguage: languages[queryUsers.native_lang], 
                userImg: queryUsers.user_img,
                learningLanguages: [queryUsers.user_language],
                onlineStatus: false,
                bio: queryUsers.bio,
            })
        }
        return acc
    }, [])
    console.log(reduceUsers);
    return res.status(200).json(reduceUsers)
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