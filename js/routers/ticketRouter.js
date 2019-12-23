const router = require('express').Router()
const ticketHandler = require('../handlers/ticketHandler')
const {BAD_REQUEST} = require('../Messages')

const { catchErrors } = require('../helpers')
/**
 * 
 * @param {JSON} req.body:{
 *          buyerId: String,
 *          eventId: Integer,
 *          tickets: [{
 *              ticketId: Integer,
 *              amount: Integer
 *          }]
 *        }
 */
async function reserveTickets(req, res){
    const {
        body: {
            buyerID = false,
            eventID = false,
            tickets = false
        }
    } = req

    if(!(buyerID && eventID && tickets)){ return res.status(400).json(BAD_REQUEST("Invalid body request.")) }
    if( tickets.length === 0 ){ return res.status(400).json(BAD_REQUEST("Invalid amount of tickets. Zero tickets not allowed."))}

    const data = {
        buyerID,
        eventID,
        tickets
    }

    var response = await ticketHandler.reserveTickets(data)
    res.json(response)
}


/**
 * 
 * @param {Object} req.body: {
 *                  eventId: Integer,
 *                  buyerId: String,
 *                  tickets: [{
 *                      ticketId: Integer,
 *                      ownerInfo: {
 *                              name: String,
 *                              SSN: String (?)
 *                          }
 *                  }],
 *                  buyerInfo : {
 *                      name: String,
 *                      email: String,
 *                      SSN: String (?)
 *                  }  
 * } 
 */
async function buyTickets(req, res){
    const {
        body: {
            buyerID = false,
            eventID = false,
            tickets = false,
            buyerInfo = false
        }
    } = req

    if(!(buyerID && eventID && tickets && buyerInfo)){ return res.status(400).json(BAD_REQUEST("Invalid body request.")) }
    if( tickets.length === 0 ){ return res.status(400).json(BAD_REQUEST("Invalid amount of tickets. Zero tickets not allowed."))}

    const data = {
        buyerID,
        eventID,
        tickets,
        buyerInfo
    }

    var response = await ticketHandler.buyTickets(data)
    res.json(response)
}


/**
 * 
 * @param {Object} req.body: {
 *                  eventId: Integer,
 *                  buyerId: String,
 *                  tickets : [{
 *                      ticketId: Integer,
 *                      amount: Integer
 *                  }] 
 * }
 */
async function releaseTickets(req,res){
    const {
        body: {
            buyerID = false,
            eventID = false,
            tickets = false
        }
    } = req

    if(!(buyerID && eventID && tickets)){ return res.status(400).json(BAD_REQUEST("Invalid body request.")) }
    if( tickets.length === 0 ){ return res.status(400).json(BAD_REQUEST("Invalid amount of tickets. Zero tickets not allowed."))}

    const data = {
        buyerID,
        eventID,
        tickets
    }

    var response = await ticketHandler.releaseTickets(data)
    res.json(response)
}

/**
 * 
 * @param {Object} req.body: {
 *                  eventId: Integer,
 *                  buyerId: String
 * }
 */
async function releaseAllTickets(req,res){
    const {
        body: {
            buyerID = false,
            eventID = false
        }
    } = req

    if(!(buyerID && eventID )){ return res.status(400).json(BAD_REQUEST("Invalid body request.")) }

    const data = {
        buyerID,
        eventID
    }

    var response = await ticketHandler.releaseAllTicketsForBuyer(data)
    res.json(response)
}

router.post('/reserveTickets', catchErrors(reserveTickets))
router.post('/buyTickets', catchErrors(buyTickets))
router.post('/releaseTickets', catchErrors(releaseTickets))
router.post('/releaseAllTickets', catchErrors(releaseAllTickets))
module.exports = router