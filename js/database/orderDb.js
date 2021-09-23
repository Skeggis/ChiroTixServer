require('dotenv').config();
const db = require('./db');
const formatter = require('../formatter')
const { SYSTEM_ERROR } = require('../Messages')
const { DB_CONSTANTS } = require('../helpers')

async function getOrderDb(orderId){

let message = {
  success: false
}
  const client = await db.getClient()
  try{
    await client.query('BEGIN');
    const result = await client.query(`select * from ${DB_CONSTANTS.ORDERS_DB} where orderid = $1`, [orderId])
    if(result.rows.length === 0){
      return {
        success: false,
        message: 'No order with that id'
      }
    }
    message.order = result.rows[0]
    

   
    const chiroInfo = await client.query(`select receiptinfo from ${DB_CONSTANTS.CHIRO_TIX_SETTINGS_DB}`)
    message.chiroInfo = chiroInfo.rows[0].receiptinfo

    await client.query('COMMIT')
    message.success = true
} catch (e){
    await client.query('ROLLBACK')
    console.log("Get search values error: ", e)
    message = SYSTEM_ERROR()
  } finally {
    client.end()
  }
  return message
}

module.exports = {
  getOrderDb
}