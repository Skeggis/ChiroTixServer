require('dotenv').config();
const db = require('./db');
const formatter = require('../formatter')
const { SYSTEM_ERROR } = require('../Messages')
const { DB_CONSTANTS } = require('../helpers')

async function getOrderDb(orderId){
  const result = await db.query(`select * from ${DB_CONSTANTS.ORDERS_DB} where orderid = $1`, [orderId])
  return result
}

module.exports = {
  getOrderDb
}