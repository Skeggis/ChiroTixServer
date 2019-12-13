import ticketDB from '../database/ticketDb'

/**
 * 
 * @param {String} buyerId
 * @param {Integer} eventId
 * @param {Array} tickets : [{
 *              ticketId: Integer,
 *              amount: Integer
 *          }] 
 */
async function reserveTickets({buyerId=-1, eventId=-1, tickets=[]}){
    const findingTicketsResponse = await ticketDB.findTickets(eventId, buyerId, tickets)
    if(findingTicketsResponse){
        const reservingTicketsResponse = await ticketDB.reserveTickets(eventId, buyerId, tickets)
        return reservingTicketsResponse
    }
    return findingTicketsResponse
}


module.exports = {reserveTickets}