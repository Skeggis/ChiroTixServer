const {
  getOrderDb
} = require('../database/orderDb')

const formatter = require('../formatter')

async function getOrder(orderId){
  const check = await getOrderDb(orderId)
  console.log('her',check.rows)
  if(check.rows.length === 0){
    return {
      result: false,
      message: 'No order with that id'
    }
  } //toto - if rows.length > 1 -> call Þórður with prerecorded message

  return {
    success: true,
    orderDetails: formatter.formatOrderDetails(check.rows[0])
  }

}

module.exports = {
  getOrder
}