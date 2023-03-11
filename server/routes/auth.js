const router = require('express').Router()
const formValidation = require('../middleware/formValidation')
const pool = require('../db')
const bcrypt = require('bcrypt')
const rateLimiter = require('../controllers/rateLimiter')
const { getImg } = require('../utils/S3Handler')

router.route('/signIn').get(async (req, res) => {
    if(req.session.user && req.session.user.username) {
        console.log('teststestestest')
        return res.status(200)
        .json({ 
            loggedIn: true, 
            username: req.session.user.username, 
            userId: req.session.user.userId,
            userImg: req.session.user.userImg
        })
    } else {
        return res.status(404).end()
    }
}).post(rateLimiter,async (req, res) => {
    const { username, password } = req.body


    const checkForUser = await pool.query(`
        SELECT id, passhash FROM users WHERE username=$1
       `, [username])
    
    if(checkForUser.rowCount === 0) {
        return res.status(404).json({type: 'username', status: 'No user found'})
    }

    const verifyPass = await bcrypt.compare(password, checkForUser.rows[0].passhash)

    
    if(verifyPass) {
        const userId = checkForUser.rows[0].id
        const fetchUserImg = (await pool.query(`
        SELECT img
        FROM user_img
        WHERE user_id = $1
        `,[userId])).rows[0].img
        const userImg = await getImg(fetchUserImg)
        req.session.user = {
            username: username,
            userId: userId,
            loggedIn: true,
            userImg: userImg,
            onlineStatus: false
        }
        const time = new Date().getTime()
        await pool.query(`
        UPDATE user_login_time
        SET time = $1
        WHERE user_id = $2;
        `,[time, userId])
        return res.status(200).json({
            loggedIn: true, 
            username, 
            userId: userId,
            userImg: userImg,
        })
    } else {
        res.status(404).json({type: 'password', status: 'Incorrect password'})
    }
    

})

router.post('/register', async  (req, res) => {
    const { 
        username, 
        email, 
        password, 
        languages: learningLanguages,
        nativeLanguage,

    } = req.body


    
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if(existingUser.rowCount !== 0) {
        return res.status(404).json({ type: 'username', status: 'username taken' })
    }

    else {
        const hashedPass = await bcrypt.hash(password, 10);
        const insertUser = await pool.query(`
        INSERT INTO users (native_lang, username, passhash) 
        SELECT language.id, $1, $2
        FROM language
        WHERE language.name = $3
        RETURNING id
        `, [username, hashedPass, nativeLanguage])
        const userId = insertUser.rows[0].id

        const insertImg = await pool.query(`
        INSERT INTO user_img (user_id, img)
        VALUES($1, 'default')
        `, [userId])


        for(let i = 0; i <= learningLanguages.length-1; i++) {
            await pool.query(`
                INSERT INTO user_language(language_id, user_id)
                SELECT language.id, $1
                FROM language
                WHERE language.name = $2
            `, [userId, learningLanguages[i]])
        }

        req.session.user = {
            username: username,
            userId: insertUser.rows[0].id,
            loggedIn: true,
            userImg: 'default',
            nativeLanguage: nativeLanguage,
        }
        const time = new Date().getTime()
        await pool.query(`
        INSERT INTO user_login_time(user_id, time) 
        VALUES($1, $2)`, [insertUser.rows[0].id, time])

        return res.status(200).json({
            username: username,
            userId: insertUser.rows[0].id,
            loggedIn: true,
            userImg: 'default',
            learningLanguages: learningLanguages,
            nativeLanguage: nativeLanguage
        })
    }
})

module.exports = router