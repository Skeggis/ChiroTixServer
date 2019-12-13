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

    //Handle

    var handleResponse = await ticketHandler.reserveTickets(data)

    res.json({})
}

function catchErrors(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
}

router.post('/reserveTickets', catchErrors(reserveTickets))
export default router