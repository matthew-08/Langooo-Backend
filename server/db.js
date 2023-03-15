const { Pool } = require('pg')
require('dotenv').config()

const ok = 'ok'
const pool = new Pool({
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
})

module.exports = pool



