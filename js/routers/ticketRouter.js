const router = require('express').Router()
const crypto = require('crypto')
const ticketHandler = require('../handlers/ticketHandler')
const { BAD_REQUEST } = require('../Messages')

const { catchErrors } = require('../helpers')

async function eventInfo(req, res) {
    let eventId = req.params.eventId
    if (!eventId) { return res.json(BAD_REQUEST("Invalid body request.")) }

    let responseData = await ticketHandler.getEventInfoWithTicketTypes(eventId)
    if (!responseData) { return res.json(BAD_REQUEST('No event with this id')) }

    responseData.success = true
    responseData.buyerId = crypto.randomBytes(20).toString('hex')
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
    console.log(response)
    if (!response.success) { return res.json(response) }

    let io = req.app.get('io')
    let timer = await calculateTime(response.reservedTickets)
    let now = new Date()
    let releaseDate = new Date(now.getTime() + (timer))

    io.sockets.connected[socketId].releaseTime = releaseDate
    io.sockets.connected[socketId].timer = timer
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
 *                  paymentOptions: {
 *                      method: String ('borgun' || 'paypal')
 *                      Token: String (only if method is borgun)
 *                      orderId: String (only if method is paypal)
 *                  },
 *                  insurance: boolean
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
            ticketTypes = false,
            socketId = false,
            paymentOptions = false,
            

        }
    } = req

    if (!(buyerId && eventId && tickets && buyerInfo)) { return res.json(BAD_REQUEST("Invalid body request.")) }
    if (tickets.length === 0) { return res.json(BAD_REQUEST("Invalid amount of tickets. Zero tickets not allowed.")) }

    const data = {
        buyerId,
        eventId,
        tickets,
        buyerInfo,
        insurance,
        ticketTypes,
        paymentOptions
    }

    var response = await ticketHandler.buyTickets(data)
    res.json(response)

    if (response.success) {
        let io = req.app.get('io')
        if (io.sockets.connected[socketId]) { clearTimeout(io.sockets.connected[socketId].timeOut) }
    }
}


/**
 * 
 * @param {Object} req.body: {
 *                  eventId: Integer,
 *                  buyerId: String,
 *                  tickets : [{
 *                      ticketTypeId: Integer,
 *                      id: Integer
 *                  }]
 * }
 */
async function releaseTickets(req, res) {
    const {
        body: {
            buyerId = false,
            eventId = false,
            tickets = false,
            socketId = false
        }
    } = req

    if (!(buyerId && eventId)) { return res.json(BAD_REQUEST("Invalid body request.")) }
    if (tickets.length === 0) { return res.json(BAD_REQUEST("Invalid amount of tickets. Zero tickets not allowed.")) }

    const data = {
        buyerId,
        eventId
    }

    var response = await ticketHandler.releaseAllTicketsForBuyer(data)

    if (response.success) {
        let io = req.app.get('io')
        if (io.sockets.connected[socketId]) { clearTimeout(io.sockets.connected[socketId].timeOut) }
    }
    res.json(response)
}

router.get('/tickets/info/:eventId', catchErrors(eventInfo))
router.post('/tickets/reserveTickets', catchErrors(reserveTickets))
router.post('/tickets/buyTickets', catchErrors(buyTickets))
router.post('/tickets/releaseTickets', catchErrors(releaseTickets))
module.exports = router