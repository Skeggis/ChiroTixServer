import { Router } from 'express'
import ticketHandler from '../handlers/ticketHandler'

const router = Router()
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

    if(!(buyerID && eventID && tickets)){ return res.status(400).json({error: "Invalid body request."}) }
    if( tickets.length === 0 ){ return res.status(400).json({error: "Invalid amount of tickets. Zero tickets not allowed."})}

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

    if(!(buyerID && eventID && tickets && buyerInfo)){ return res.status(400).json({error: "Invalid body request."}) }
    if( tickets.length === 0 ){ return res.status(400).json({error: "Invalid amount of tickets. Zero tickets not allowed."})}

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

    if(!(buyerID && eventID && tickets)){ return res.status(400).json({error: "Invalid body request."}) }
    if( tickets.length === 0 ){ return res.status(400).json({error: "Invalid amount of tickets. Zero tickets not allowed."})}

    const data = {
        buyerID,
        eventID,
        tickets
    }

    var response = await ticketHandler.releaseTickets(data)
    res.json(response)
}

function catchErrors(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
}

router.post('/reserveTickets', catchErrors(reserveTickets))
router.post('/buyTickets', catchErrors(buyTickets))
router.post('/releaseTickets', catchErrors(releaseTickets))
export default router