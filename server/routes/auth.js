const router = require('express').Router()
const formValidation = require('../middleware/formValidation')
const pool = require('../db')
const bcrypt = require('bcrypt')
const rateLimiter = require('../controllers/rateLimiter')

router.route('/signIn').get(async (req, res) => {
    if(req.session.user && req.session.user.username) {
        return res.status(200)
        .json({ 
            loggedIn: true, 
            username: req.session.user.username, 
            userId: req.session.user.userId,
            userImg: '' 
        })
    } else {
        return res.status(404).end()
    }
}).post(rateLimiter,async (req, res) => {
    const { username, password } = req.body
    console.log(req.body)


    const checkForUser = await pool.query(`
        SELECT id, passhash FROM users WHERE username=$1
       `, [username])
    
    if(checkForUser.rowCount === 0) {
        return res.status(404).json({type: 'username', status: 'No user found'})
    }

    const verifyPass = await bcrypt.compare(password, checkForUser.rows[0].passhash)

    if(verifyPass) {
        req.session.user = {
            username: username,
            userId: checkForUser.rows[0].id,
            loggedIn: true,
            userImg: '',
            onlineStatus: false
        }
        return res.status(200).json({
            loggedIn: true, 
            username, 
            userId: checkForUser.rows[0].id,
            userImg: null,
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

    console.log(req.body);

    
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
            userImg: '',
            nativeLanguage: nativeLanguage,
        }
        return res.status(200).json({
            username: username,
            userId: insertUser.rows[0].id,
            loggedIn: true,
            userImg: '',
            learningLanguages: learningLanguages,
            nativeLanguage: nativeLanguage
        })
    }
})

module.exports = router