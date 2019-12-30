const db = require('./db');
const formatter = require('../formatter')
const { DB_CONSTANTS } = require('../helpers')

let {
    USERS_DB
} = DB_CONSTANTS

//TODO: make email insensitive to CASE!!!!
async function getUserFromEmail(email) {
    let query = `select * from ${USERS_DB} where email='${email}'`
    let result = await db.query(query)
    if (!result || !result.rows[0]) { return false }
    let user = await formatter.formatUser(result.rows[0])
    return user
}

async function getUserFromId(uuid) {
    let query = `select * from ${USERS_DB} where id='${uuid}'`
    let result = await db.query(query)
    if (!result || !result.rows[0]) { return false }
    let user = await formatter.formatUser(result.rows[0])
    return user
}

async function createUser({name='',email='', password=''}){
    let query = `insert into ${USERS_DB} (name, email, password) values($1,$2,$3) returning *`
    let result = await db.query(query, [name, email, password])
    if(!result || !result.rows[0]){return false}
    return await formatter.formatUser(result.rows[0])
}


module.exports = {getUserFromId, getUserFromEmail, createUser}