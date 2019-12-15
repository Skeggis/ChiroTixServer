const ticketDB = require('../database/ticketDb')
const {SYSTEM_ERROR} = require('../Messages')

/**
 * 
 * @param {String} buyerId
 * @param {Integer} eventId
 */
async function releaseAllTicketsForBuyer({buyerId=-1, eventId=-1}){
    let success = await ticketDB.releaseAllTicketsForBuyer(buyerId, eventId)
    if(!success){return SYSTEM_ERROR}
    return {success:true}
}

/**
 * 
 * @param {String} buyerId
 * @param {Integer} eventId
 * @param {Array} tickets : [{
 *              ticketId: Integer,
 *              amount: Integer
 *          }] 
 */
async function releaseTickets({buyerId=-1, eventId=-1, tickets=[]}){
    let reservedTicketIds = []
    let ticketTypesAmount = []
    for(let j = 0; j < tickets.length; j++){ 
        let ticket = tickets[j]
        reservedTicketIds.push(ticket.id) 
        if(!ticketTypesAmount[ticket.ticketId]){ ticketTypesAmount[ticket.ticketId] = 1}
        else { ticketTypesAmount[ticket.ticketId]++ }
    }

    let reservedTickets = await ticketDB.getReservedTickets(reservedTicketIds, eventId, buyerId)

    if(!reservedTickets || reservedTickets.length != reservedTicketIds.length){return SYSTEM_ERROR }

    let response = await ticketDB.releaseTickets(reservedTicketIds, ticketTypesAmount, eventId)

    return response
}

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
    let ticketIds = []
    for(let j = 0; j < tickets.length; j++){ ticketIds.push(tickets[j].ticketId) }
    
    const ticketTypes = await ticketDB.getTicketTypes(ticketIds)
    let ticketCheckResponse = await checkForAvailableTickets(ticketTypes, tickets)
    
    if(ticketCheckResponse.success){
        const reservingTicketsResponse = await ticketDB.reserveTickets(eventId, buyerId, tickets)
        return reservingTicketsResponse
    }
    return ticketCheckResponse
}

async function checkForAvailableTickets(ticketTypes, tickets){
    if(!ticketTypes[0]){ return SYSTEM_ERROR }

    let ticketsNotFound = []
    for(let j = 0; j < tickets.length; j++){
        let ticket = tickets[j]
        for(let i = 0; i < ticketTypes.length; i++){
            let ticketType = ticketTypes[i]
            if(ticket.ticketId === ticketType.id){
                let ticketsLeft = ticketType.amount - (ticketType.reserved+ticketType.sold)
                if(ticketsLeft <= 0 || ticketsLeft < ticket.amount){
                    ticketsNotFound.push({
                        ticketId: ticket.ticketId,
                        message: (ticketsLeft <= 10 ? `There are only ${ticketsLeft} `:`There are fewer than ${ticket.amount} `) + `tickets left of type: ${ticketType.name}.\n` 
                    })
                }
            }
        }
    }
    if(!ticketsNotFound || ticketsNotFound.length > 0){ return {success:false, ticketsError: ticketsNotFound} }
    return {success: true}
}


/**
 * @param {Integer} eventId
 * @param {String} buyerId
 * @param {Array} tickets : [{
 *                  ticketId: Integer,
 *                  ownerInfo: {
 *                          name: String,
 *                          SSN: String (?)
 *                      }
 *              }]
 * @param {JSON} buyerInfo : {
 *                      name: String,
 *                      email: String,
 *                      SSN: String (?)
 *                  }    
 */
async function buyTickets({eventId=-1, buyerId=-1, tickets=[], buyerInfo={}}){
    //Check if this buyer has reserved the tickets he is trying to buy.
    let reservedTickets = await ticketDB.getAllReservedTicketsForBuyer(buyerId, eventId, tickets)

    if(!( await ticketsReservedMatchBuyerTickets(reservedTickets, tickets) )) {return SYSTEM_ERROR}

    let receipt = {} //Get from Borgun/Paypal. TODO: Paypal/Borgun

    const buyingTicketsResponse = await ticketDB.buyTickets(eventId, buyerId, tickets, buyerInfo, receipt)
    return buyingTicketsResponse
}

async function ticketsReservedMatchBuyerTickets(reservedTickets, tickets){
    let buyerTicketTypes = []
    let reservedTicketTypes = []

    //Count how many tickets of each type the DB thinks this buyer has reserved.
    for(let i = 0; i < reservedTickets.length; i++){ 
        let ticket = reservedTickets[i]
        if(!reservedTicketTypes[ticket.ticketId]) { reservedTicketTypes[ticket.ticketId] = 1 }
        else { reservedTicketTypes[ticket.ticketId]++ }
    }

    //Count how many tickets this buyer is trying to buy.
    for(let i = 0; i < tickets.length; i++){ 
        let ticket = tickets[i]
        if(!buyerTicketTypes[ticket.ticketId]) { buyerTicketTypes[ticket.ticketId] = 1 }
        else { buyerTicketTypes[ticket.ticketId]++ }
    }

    //Check that the amount of each ticket this buyer is trying to buy is the same that the DB thinks he has reserved.
    let ticketTypeIds = Object.keys(buyerTicketTypes)
    for(let i = 0; i < ticketTypeIds.length; i++){
        let id = ticketTypeIds[i]
        if(buyerTicketTypes[id] != reservedTicketTypes[id]){ return false }
    }
    return true
}


module.exports = {reserveTickets, buyTickets, releaseTickets, releaseAllTicketsForBuyer}