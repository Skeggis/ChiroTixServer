require('dotenv').config()
const router = require('express').Router()
const crypto = require('crypto')
const ticketHandler = require('../handlers/ticketHandler')
const { BAD_REQUEST, SYSTEM_ERROR } = require('../Messages')
const { catchErrors } = require('../helpers')



async function eventInfo(req, res) {
    let eventId = req.params.eventId
    if (!eventId) { return res.json(BAD_REQUEST("Invalid body request.")) }

    let responseData = await ticketHandler.getEventInfoWithTicketTypes(eventId)
    if(responseData.success){responseData.buyerId = crypto.randomBytes(20).toString('hex')}
    
    res.json(responseData)
}

/**
 * 
 * @param {JSON} req.body:{
 *          buyerId: String,
 *          eventId: Integer,
 *          ticketTypes: [{
 *              id: Integer,
 *              amount: Integer
 *          }]
 *        }
 */
async function reserveTickets(req, res) {
    const {
        buyerId = false,
        eventId = false,
        ticketTypes = false,
        socketId = false

    } = req.body

    if (!(buyerId && eventId && ticketTypes && socketId)) { return res.json(BAD_REQUEST("Invalid body request.")) }
    if (ticketTypes.length === 0) { return res.json(BAD_REQUEST("Invalid amount of tickets. Zero tickets not allowed.")) }

    const data = {
        buyerId,
        eventId,
        ticketTypes
    }

    var response = await ticketHandler.reserveTickets(data)
    if (!response.success) { return res.json(response) }

    let io = req.app.get('io')
    let timer = await calculateTime(response.reservedTickets)
    let now = new Date()
    let releaseDate = new Date(now.getTime() + (timer))

    if(io && io.sockets.connected[socketId] && !process.env.TEST){
        io.sockets.connected[socketId].releaseTime = releaseDate
        io.sockets.connected[socketId].timer = timer
    }

    response.timer = timer
    response.releaseTime = releaseDate

    res.json(response)
}

async function calculateTime(tickets) {
    let ONE_MINUTE = 60000
    let time = ONE_MINUTE * 7 //7 minutes for billingInfo
    for (let i = 0; i < tickets.length; i++) { time += tickets[i].ownerInfo.length * ONE_MINUTE }
    time += ONE_MINUTE * 10 //Ten minutes for the payment step
    return time
}


/**
 * 
 * @param {Object} req.body: {
 *                  eventId: Integer,
 *                  buyerId: String,
 *                  tickets: [{
 *                      ticketTypeId: Integer,
 *                      ownerInfo: {
 *                              name: String,
 *                              SSN: String (?)
 *                          }
 *                  }],
 *                  buyerInfo : {
 *                      name: String,
 *                      email: String,
 *                      SSN: String (?)
 *                  },
 *                  cardInformaition: {?},
 *                  paymentOptions: {
 *                      method: String('borgun' | 'paypal'),
 *                      insuranceVerified: boolean (only if methid = 'borgun'),
 *                      Token: String (only if method is borgun)
 *                      orderId: String (only if method is paypal)
 *                  }
 * } 
 */
async function buyTickets(req, res) {
    const {
        body: {
            buyerId = false,
            eventId = false,
            tickets = false,
            buyerInfo = false,
            insurance = false,
            insurancePrice = 0,//TODO: should not depend on client to send the insurance price, or yes you should depend on the client but also confirm it on the server
            ticketTypes = false,
            socketId = false,
            paymentOptions = false
        }
    } = req

    //TODO: Validate paymentOptionsEtc.
    if (!(buyerId && eventId && tickets && buyerInfo && socketId)) { return res.json(BAD_REQUEST("Invalid body request.")) }
    if (tickets.length === 0) { return res.json(BAD_REQUEST("Invalid amount of tickets. Zero tickets not allowed.")) }

    const workQueue = req.app.get('workQueue')
    const data = {
        buyerId,
        eventId,
        tickets,
        buyerInfo,
        insurance,
        insurancePrice,
        ticketTypes,
        paymentOptions,
        socketId,
        workQueue,
        paymentOptions
    }

    // var response = {}
    // try {
    //     response = await ticketHandler.buyTickets(data)
    // } catch (error) {
    //     console.log("Error Buying tickets", error)
    //     response = SYSTEM_ERROR()
    // }

    // if (response.success) {
    //     console.log("SUCCESS??")
    //     let io = req.app.get('io')
    //     if (io && io.sockets.connected[socketId] && !process.env.TEST) { clearTimeout(io.sockets.connected[socketId].timeOut) }
    // }
    const job = await workQueue.add(data)

    return {success: true}
}


/**
 * 
 * @param {Object} req.body: {
 *                  eventId: Integer,
 *                  buyerId: String,
 *                  socketId: String
 * }
 */
async function releaseTickets(req, res) {
    const {
        body: {
            buyerId = false,
            eventId = false,
            socketId = false
        }
    } = req

    if (!(buyerId && eventId)) { return res.json(BAD_REQUEST("Invalid body request.")) }

    const data = {
        buyerId,
        eventId
    }

    var response = await ticketHandler.releaseAllTicketsForBuyer(data)

    if (response.success) {
        let io = req.app.get('io')
        if (io && io.sockets.connected[socketId] && !process.env.TEST) { clearTimeout(io.sockets.connected[socketId].timeOut) }
    }
    res.json(response)
}

router.get('/tickets/info/:eventId', catchErrors(eventInfo))
router.post('/tickets/reserveTickets', catchErrors(reserveTickets))
router.post('/tickets/buyTickets', catchErrors(buyTickets))
router.post('/tickets/releaseTickets', catchErrors(releaseTickets))
module.exports = router