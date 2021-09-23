const {
  getOrderDb
} = require('../database/orderDb')

const formatter = require('../formatter')

async function getOrder(orderId){
  const result = await getOrderDb(orderId)
  console.log(result.order.receipt.lines)
  if(result.success){
    return {
      success: result.success,
      chiroInfo: result.chiroInfo,
      orderDetails: await formatter.formatOrderDetails(result.order)
    }
  } else {
    return {
      success: false,
      message: result.message
    }
  }

}

module.exports = {
  getOrder
}