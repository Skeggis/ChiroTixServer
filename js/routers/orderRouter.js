const router = require('express').Router()
const {BAD_REQUEST, CREATED} = require('../Messages')
const { catchErrors } = require('../helpers')
const {
  getOrder
} = require('../handlers/orderHandler')

async function getOrderRoute(req,res){
  const orderId = req.params.orderId
  console.log(orderId)
  const result = await getOrder(orderId)
  console.log(result)

  if(result.success){
    return res.status(200).json(result)
  }

  return res.status(400).json(result.message)
}

router.get('/orders/:orderId', catchErrors(getOrderRoute))

module.exports = router