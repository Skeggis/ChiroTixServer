const db = require('./db');
const formatter = require('../formatter')
const { DB_CONSTANTS } = require('../helpers')

let {
    CHIRO_TIX_SETTINGS_DB
} = DB_CONSTANTS

async function getSettings() {
    let query = `select * from ${CHIRO_TIX_SETTINGS_DB}`
    let result = await db.query(query)
    if (!result || !result.rows[0]) { return false }
    let settings = await formatter.formatChiroTixSettings(result.rows[0])
    return settings
}

module.exports = {getSettings}