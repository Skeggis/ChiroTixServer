const ticketDb = require('../database/ticketDb')
const {SYSTEM_ERROR} = require('../Messages')
const {
    sendReceiptMail
} = require('../handlers/emailHandler')
const {createTicketsPDF} = require('../createPDFHTML/createPDF')



async function getEventInfoWithTicketTypes(eventId){
    let data = await ticketDb.getEventInfoWithTicketTypes(eventId)
    return data
}
/**
 * 
 * @param {String} buyerId
 * @param {Integer} eventId
 */
async function releaseAllTicketsForBuyer({buyerId=-1, eventId=-1}){
    let success = await ticketDb.releaseAllTicketsForBuyer(buyerId, eventId)
    if(!success){return SYSTEM_ERROR}
    return {success:true}
}

/**
 * 
 * @param {String} buyerId
 * @param {Integer} eventId
 * @param {Array} tickets : [{
 *              id: Integer,
 *              ticketTypeId: Integer
 *          }] 
 */
async function releaseTickets({buyerId=-1, eventId=-1, tickets=[]}){
    let reservedTicketIds = []
    let ticketTypesAmount = []
    //Count how many tickets of each type the buyer had reserved, and make an array with all the ticket.ids (ids from the sold table)
    for(let j = 0; j < tickets.length; j++){ 
        let ticket = tickets[j]
        reservedTicketIds.push(ticket.id) 
        if(!ticketTypesAmount[ticket.ticketTypeId]){ ticketTypesAmount[ticket.ticketTypeId] = 1}
        else { ticketTypesAmount[ticket.ticketTypeId]++ }
    }

    let reservedTickets = await ticketDb.getReservedTickets(reservedTicketIds, eventId, buyerId)

    if(!reservedTickets || reservedTickets.length != reservedTicketIds.length){return SYSTEM_ERROR }

    let response = await ticketDb.releaseTickets(reservedTicketIds, ticketTypesAmount, eventId)

    return response
}

/**
 * 
 * @param {String} buyerId
 * @param {Integer} eventId
 * @param {Array} ticketTypes : [{
 *              id: Integer,
 *              amount: Integer
 *          }] 
 */
async function reserveTickets({buyerId=-1, eventId=-1, ticketTypes=[]}){
    let ticketIds = []
    let ticketTypesToBuy = []

    for(let j = 0; j < ticketTypes.length; j++){ 
        if(ticketTypes[j].amount > 0){
            ticketIds.push(ticketTypes[j].id)
            ticketTypesToBuy.push(ticketTypes[j])
        } 
    }


    const ticketTypesForEvent = await ticketDb.getTicketTypes(ticketIds)
    if(!ticketTypes){return SYSTEM_ERROR }
console.log(ticketTypesForEvent, ticketTypesToBuy)
    let ticketCheckResponse = await checkForAvailableTickets(ticketTypesForEvent, ticketTypesToBuy)
    
    if(ticketCheckResponse.success){
        const reservingTicketsResponse = await ticketDb.reserveTickets(eventId, buyerId, ticketTypesToBuy)
        return reservingTicketsResponse
    }
    return ticketCheckResponse
}

/**
 * 
 * @param {Array} ticketTypesForEvent {
 *              id: Integer (id of the ticketType),
 *              amount: Integer (amount of tickets that can be sold),
 *              reserved: Integer,
 *              sold: Integer
 * }
 * @param {Array} ticketTypesToBuy : [{
 *              ticketTypeId: Integer,
 *              amount: Integer
 *          }] 
 */
async function checkForAvailableTickets(ticketTypesForEvent, ticketTypesToBuy){
    if(!ticketTypesForEvent[0]){ return SYSTEM_ERROR }

    let ticketsNotFound = []
    for(let j = 0; j < ticketTypesToBuy.length; j++){
        let ticketTypeToBuy = ticketTypesToBuy[j]
        for(let i = 0; i < ticketTypesForEvent.length; i++){
            let ticketType = ticketTypesForEvent[i]
            if(ticketTypeToBuy.id === ticketType.id){
                let ticketsLeft = ticketType.amount - (ticketType.reserved+ticketType.sold)
                if(ticketsLeft <= 0 || ticketsLeft < ticketTypeToBuy.amount){
                    ticketsNotFound.push({
                        ticketTypeId: ticketTypeToBuy.ticketTypeId,
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
 *                  id: Integer,
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
async function buyTickets({eventId=-1, buyerId=-1, tickets=[], buyerInfo={}, insurance=null, insurancePrice = 0, ticketTypes={}}){
    //Check if this buyer has reserved the tickets he is trying to buy.
    console.log('Tickets:', tickets)
    let reservedTickets = await ticketDb.getAllReservedTicketsForBuyer(buyerId, eventId, tickets)
console.log('reserved', reservedTickets)
    if(!( await ticketsReservedMatchBuyerTickets(reservedTickets, tickets) )) {
        console.log('HEEER')
        return SYSTEM_ERROR
    }

    let receipt = {
        cardNumber: '7721',
        expiryDate: '03/22',
        amount: 200,
        name: 'Róbert Ingi Huldarsson',
        address: 'Álfaberg 24',
        place: '221, Hafnarfjörður',
        country: 'Iceland',
        lines: ticketTypes
    } //Get from Borgun/Paypal. TODO: Paypal/Borgun

    const buyingTicketsResponse = await ticketDb.buyTickets(eventId, buyerId, tickets, buyerInfo, receipt, insurance, insurancePrice)
    console.log('TEST',buyingTicketsResponse)

    //todo: send email:
    const orderId = buyingTicketsResponse.orderDetails.orderId
    console.log(orderId)
    await sendReceiptMail(
        `http://localhost:3000/orders/${orderId}`, 
        'noreply@chirotix.com', 
        buyingTicketsResponse.orderDetails.buyerInfo.email, 
        'ChiroTix order')

    return buyingTicketsResponse
}

/**
 * 
 * @param {Array} reservedTickets : [{
                            id: ticket.id,
                            eventId: ticket.evendid,
                            ticketId: ticket.ticketid,
                            receipt: ticket.receipt,
                            buyerId: ticket.buyerid,
                            buyerInfo: ticket.buyerinfo,
                            ownerInfo: ticket.ownerinfo,
                            date: ticket.date
 *                      }]
 * @param {Array} tickets : [{
 *                  id: Integer,
 *                  ticketTypeId: Integer,
 *                  ownerInfo: {
 *                          name: String,
 *                          SSN: String (?)
 *                      }
 *              }]
 */
async function ticketsReservedMatchBuyerTickets(reservedTickets, tickets){
    let buyerTicketTypes = []
    let reservedTicketTypes = []

    //Count how many tickets of each type the DB thinks this buyer has reserved.
    for(let i = 0; i < reservedTickets.length; i++){ 
        let ticket = reservedTickets[i]
        if(!reservedTicketTypes[ticket.ticketId]) { reservedTicketTypes[ticket.ticketTypeId] = 1 }
        else { reservedTicketTypes[ticket.ticketTypeId]++ }
    }

    //Count how many tickets this buyer is trying to buy.
    for(let i = 0; i < tickets.length; i++){ 
        let ticket = tickets[i]
        if(!buyerTicketTypes[ticket.ticketTypeId]) { buyerTicketTypes[ticket.ticketTypeId] = 1 }
        else { buyerTicketTypes[ticket.ticketTypeId]++ }
    }

    //Check that the amount of each ticket type this buyer is trying to buy is the same that the DB thinks he has reserved.
    let ticketTypeIds = Object.keys(buyerTicketTypes)
    for(let i = 0; i < ticketTypeIds.length; i++){
        let id = ticketTypeIds[i]
        if(buyerTicketTypes[id] != reservedTicketTypes[id]){ return false }
    }
    return true
}

/**
 * 
 * @param {*} data 
 */
async function sendReceiptEmailWithPDF(data){
    let receipt = await createTicketsPDF(data)
    // let receipt = await createTicketsPDF(data.eventInfo, data.tickets)
    //Send email with pdf (buffer is pdf iff success is true)
    return receipt
}


module.exports = {reserveTickets, buyTickets, releaseTickets, releaseAllTicketsForBuyer, getEventInfoWithTicketTypes, sendReceiptEmailWithPDF}