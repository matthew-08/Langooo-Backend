const pool = require('../db')
const router = require('express').Router()
const userOnline = require('../redis').userOnline
const multer = require('multer')
const { postImg, getImg } = require('../utils/S3Handler')




router.get('/allUsers/', async (req, res) => {
    const userId = req.session.user.userId

    const queryUsers = (await pool.query(`
    SELECT users.id, username, native_lang, user_img.img,
    users.bio, language.name AS user_language, 
    user_login_time.time AS login_time
    FROM users
    JOIN
    user_language
    ON users.id = user_language.user_id
    JOIN language
    ON user_language.language_id = language.id
    JOIN user_login_time
    ON users.id = user_login_time.user_id
    JOIN user_img
    ON users.id = user_img.user_id
    WHERE users.id != $1
    `, [userId])).rows

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
                userImg: queryUsers.img,
                learningLanguages: [queryUsers.user_language],
                onlineStatus: null,
                bio: queryUsers.bio,
                lastLogin: queryUsers.login_time,
            })
        }
        return acc
    }, [])

    for(let i = 0; i <= reduceUsers.length - 1; i++) {
        const userOnlineStatus = await userOnline(reduceUsers[i].userId)
        reduceUsers[i].onlineStatus = userOnlineStatus
        if(reduceUsers[i].userImg !== 'default') {
            await getImg(reduceUsers[i].userImg)
            .then(res => {
                reduceUsers[i].userImg = res
            })
            .catch(r => reduceUsers[i].userImg = 'default')
        }
    }
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

    const fetchedConvos = conversations.rows
    
    const allUserConvos = await Promise.all(fetchedConvos.map(async (convo) => {
        const fetchLatestMessage = await pool.query(`
        SELECT * FROM message 
        WHERE conversation = $1
        ORDER BY time 
        DESC LIMIT 1
        `, [convo.id])
        let latestMessage
        if(fetchLatestMessage.rowCount > 0) {
            const { content, time, sender } = fetchLatestMessage.rows[0]
            latestMessage = {
                content: content,
                timestamp: time,
                userId: sender,
            }
        }
        else {
            latestMessage = null
        } 
        return {
            conversationId: convo.id,
            userId: convo.user_id,
            latestMessage: latestMessage,
        }
    }))

    return res.status(200).json(allUserConvos);
    
})

const storage = multer.memoryStorage()

const upload = multer({ storage })

router.post('/uploadImage', upload.single('image'), async (req, res) => {
   const { file } = req
    try {
        await postImg(file)
        .then(async imgId => { // returns img ID to store in database.
            const { userId } = req.session.user
            await pool.query(`
            UPDATE user_img
            SET img = $2
            WHERE user_id = $1
            `,[userId, imgId])
        }) 
    } catch (error) {
        return res.status(404).json({status: 'Server error, please try again later.'})
    }
    res.status(200).end()
})

router.put('/updateUser', async (req, res) => {
    const { userId, updatedInfo } = req.body
    const {
        username,
        languages,
        nativeLanguage,
        bio
    } = updatedInfo

    const nativeLangId = (await pool.query(`
    SELECT language.id
    FROM language
    WHERE name = $1
    `,[nativeLanguage])).rows[0].id

    await pool.query(`
    DELETE FROM user_language
    WHERE user_id = $1
    `, [userId])


    for(let i = 0; i <= languages.length - 1; i++) {
        const language = languages[i]
        await pool.query(`
        INSERT INTO user_language(language_id, user_id)
        SELECT language.id, $1
        FROM language
        WHERE language.name = $2
        `,[userId, language])
    }

    await pool.query(`
    UPDATE users
    SET username = $1,
    bio = $2,
    native_lang = $3
    WHERE users.id = $4
    `, [username, bio, nativeLangId, userId])
    req.session.user.username = username
    req.session.user.bio = bio,
    req.session.user.nativeLanguage = nativeLanguage,
    req.session.user.learningLanguages = languages

    return res.status(200).end()
})

module.exports = router