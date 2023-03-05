const router = require('express').Router()
const formValidation = require('../middleware/formValidation')
const pool = require('../db')
const bcrypt = require('bcrypt')
const rateLimiter = require('../controllers/rateLimiter')

router.route('/signIn').get(async (req, res) => {
    console.log('sign in attempt')
    console.log(req.session.user)
    if(req.session.user && req.session.user.username) {
        return res.status(200)
        .json({ 
            loggedIn: true, 
            username: req.session.user.username, 
            userId: req.session.user.id,
            userImg: '' 
        })
    } else {
        return res.status(404).end()
    }
}).post(rateLimiter,async (req, res) => {
    const { username, password } = req.body
    console.log(req.body)


    const checkForUser = await pool.query('SELECT * FROM users WHERE username=$1', [username])
    
    if(checkForUser.rowCount === 0) {
        return res.status(404).json({type: 'username', status: 'No user found'})
    }

    const verifyPass = await bcrypt.compare(password, checkForUser.rows[0].passhash)

    if(verifyPass) {
        req.session.user = {
            username: username,
            userId: checkForUser.rows[0].id,
            loggedIn: true,
            userImg: ''
        }
        return res.status(200).json({
            loggedIn: true, 
            username, 
            userId: checkForUser.rows[0].id,
            userImg: null
        })
    } else {
        res.status(404).json({type: 'password', status: 'Incorrect password'})
    }
    

})

router.post('/register', async  (req, res) => {
    const { username, email, password } = req.body

    
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if(existingUser.rowCount !== 0) {
        return res.status(404).json({ type: 'username', status: 'username taken' })
    }
    else {
        const hashedPass = await bcrypt.hash(password, 10);
        const insertUser = await pool.query('INSERT INTO users (username, passhash) VALUES($1, $2) RETURNING id', [username, hashedPass])
        req.session.user = {
            username: username,
            userId: insertUser.rows[0].id,
            loggedIn: true,
            userImg: '',
        }
        return res.status(200).json({
            username: username,
            userId: insertUser.rows[0].id,
            loggedIn: true,
            userImg: '',
        })
    }
})

module.exports = router