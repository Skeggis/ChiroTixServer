const {
  getOrderDb
} = require('../database/orderDb')

const formatter = require('../formatter')

async function getOrder(orderId){
  const result = await getOrderDb(orderId)

  if(result.success){
    return {
      success: result.success,
      chiroInfo: result.chiroInfo,
      orderDetails: formatter.formatOrderDetails(result.order)
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