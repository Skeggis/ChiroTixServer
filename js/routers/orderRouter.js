const router = require('express').Router()
const {BAD_REQUEST, CREATED} = require('../Messages')
const { catchErrors } = require('../helpers')
const {
  getOrder
} = require('../handlers/orderHandler')

async function getOrderRoute(req,res){
  const orderId = req.params.orderId
  const result = await getOrder(orderId)
  console.log(result)
    return res.status(200).json(result)
  

}

router.get('/orders/:orderId', catchErrors(getOrderRoute))

module.exports = router