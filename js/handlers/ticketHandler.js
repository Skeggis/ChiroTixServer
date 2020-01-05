require('dotenv').config()
const { HOST } = require('../helpers')
const ticketDb = require('../database/ticketDb')
const settingsDb = require('../database/settingsDb')
const { SYSTEM_ERROR, BAD_REQUEST } = require('../Messages')
const {
    sendReceiptMail
} = require('../handlers/emailHandler')
const { createTicketsPDF } = require('../createPDFHTML/createPDF')
const crypto = require('crypto')
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');


const WEBSITE_URL = process.env.WEBSITE_URL



async function getEventInfoWithTicketTypes(eventId) { return await ticketDb.getEventInfoWithTicketTypes(eventId) }
/**
 * 
 * @param {String} buyerId
 * @param {Integer} eventId
 */
async function releaseAllTicketsForBuyer({ buyerId = -1, eventId = -1 }) {
    let success = await ticketDb.releaseAllTicketsForBuyer(buyerId, eventId)
    if (!success) { return SYSTEM_ERROR }
    return { success: true }
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
// async function releaseTickets({ buyerId = -1, eventId = -1, tickets = [] }) {
//     let reservedTicketIds = []
//     let ticketTypesAmount = []
//     //Count how many tickets of each type the buyer had reserved, and make an array with all the ticket.ids (ids from the sold table)
//     for (let j = 0; j < tickets.length; j++) {
//         let ticket = tickets[j]
//         reservedTicketIds.push(ticket.id)
//         if (!ticketTypesAmount[ticket.ticketTypeId]) { ticketTypesAmount[ticket.ticketTypeId] = 1 }
//         else { ticketTypesAmount[ticket.ticketTypeId]++ }
//     }

//     let reservedTickets = await ticketDb.getReservedTickets(reservedTicketIds, eventId, buyerId)

//     if (!reservedTickets || reservedTickets.length != reservedTicketIds.length) { return SYSTEM_ERROR }

//     let response = await ticketDb.releaseTickets(reservedTicketIds, ticketTypesAmount, eventId)

//     return response
// }

/**
 * 
 * @param {String} buyerId
 * @param {Integer} eventId
 * @param {Array} ticketTypes : [{
 *              id: Integer,
 *              amount: Integer
 *          }] 
 */
async function reserveTickets({ buyerId = -1, eventId = -1, ticketTypes = [] }) {
    let { success } = await releaseAllTicketsForBuyer({ buyerId, eventId })
    if (!success) { return SYSTEM_ERROR }

    let ticketIds = []
    let ticketTypesToBuy = []
    for (let j = 0; j < ticketTypes.length; j++) {
        if (ticketTypes[j].amount > 0) {
            ticketIds.push(ticketTypes[j].id)
            ticketTypesToBuy.push(ticketTypes[j])
        }
    }

    if (ticketTypesToBuy.length === 0) { return { success: false, messages: [{ type: "error", message: "You must buy at least 1 ticket.", title: "No tickets selected" }] } }
    const ticketTypesForEvent = await ticketDb.getTicketTypes(ticketIds)
    if (!ticketTypes) { return SYSTEM_ERROR }

    let ticketCheckResponse = await checkForAvailableTickets(ticketTypesForEvent, ticketTypesToBuy)

    if (ticketCheckResponse.success) { return await ticketDb.reserveTickets(eventId, buyerId, ticketTypesToBuy) }
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
async function checkForAvailableTickets(ticketTypesForEvent, ticketTypesToBuy) {
    if (!ticketTypesForEvent[0]) { return SYSTEM_ERROR }

    let ticketsNotFound = []
    for (let j = 0; j < ticketTypesToBuy.length; j++) {
        let ticketTypeToBuy = ticketTypesToBuy[j]

        let ticketType = ticketTypesForEvent.find(ticketType => ticketType.id === ticketTypeToBuy.id)
        if (!ticketType) {
            ticketsNotFound.push({
                type: "error",
                message: `Could not find a ticket of type: ${ticketTypeToBuy.name}`
            })
            break;
        }

        let ticketsLeft = ticketType.amount - (ticketType.reserved + ticketType.sold)
        if (ticketsLeft <= 0 || ticketsLeft < ticketTypeToBuy.amount) {
            ticketsNotFound.push({
                ticketTypeId: ticketTypeToBuy.ticketTypeId,
                type: "error",
                message: (ticketsLeft <= 10 ? `There ${ticketsLeft > 1 ? `are only ${ticketsLeft} ` : ticketsLeft === 1 ? `is only 1 ` : `are no`} ` : `There are fewer than ${ticket.amount} `) + `${ticketsLeft === 1 ? 'ticket' : 'tickets'} left of type: ${ticketType.name}.\n`
            })
        }
    }
    if (!ticketsNotFound || ticketsNotFound.length > 0) { return { success: false, messages: ticketsNotFound } }
    return { success: true }
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
// {
//     "name":"ChiroPraktik 101",
//     "country":"Germany",
//     "city":"Berlin",
//     "streetName": "Agnes-Wabnitz-Straße 9, 10249",
//     "dates": "Jan 3-5, 2020",
//     "schedule": ["Fri:   10:00 AM - 6:30 PM",
//         "Sat:  8:30   AM - 6:30 PM",
//         "Sun: 8:00   AM - 1:00 PM"],
//     "tickets":[{
//         "name":"Chiropraktor",
//         "price":333.33333,
//         "id":"123",
//         "ownerInfo":[{
//             "label":"Attendee name",
//             "value":"Þórður Ágústsson"
//         },{
//             "label":"School",
//             "value":"Macquarie University"
//         }]
//     }],
//     "CECredits":3,
//     "organization":"ICPA",
//     "termsTitle":"Tickets Terms",
//     "orderId": "109238"
// }
async function buyTickets({ eventId = -1, buyerId = -1, tickets = [], buyerInfo = {}, insurance = null, ticketTypes = {}, paymentOptions = {} }) {
    let isBuying = await ticketDb.isBuying(eventId, buyerId)

    if (isBuying) { return { success: false, messages: [{ type: "error", message: "We are processing your payment. Please wait a few moments." }] } }

    //Check if this buyer has reserved the tickets he is trying to buy.
    let reservedTickets = await ticketDb.getAllReservedTicketsForBuyer(buyerId, eventId, tickets)

    if (!reservedTickets) { return SYSTEM_ERROR }
    if (!(await ticketsReservedMatchBuyerTickets(reservedTickets, tickets))) { return { success: false, messages: [{ type: "error", message: "The tickets you are trying to buy and the tickets reserved for you don't match. Please try again." }] } }

    let settings = await settingsDb.getSettings()

    if (!settings) { return SYSTEM_ERROR }

    for (let i = 0; i < tickets.length; i++) {
        tickets[i].termsTitle = settings.ticketsTermsTitle
        tickets[i].termsText = settings.ticketsTermsText
    }

    const paymentResult = await handlePayment(paymentOptions, insurance)
    if(!paymentResult.success){
        return paymentResult
    }
    console.log(paymentResult)

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

    const buyingTicketsResponse = await ticketDb.buyTickets(eventId, buyerId, tickets, buyerInfo, receipt, insurance)

    if (!buyingTicketsResponse.success) { return buyingTicketsResponse }

    let createPDFResponse = await createTicketsPDF({ eventInfo: buyingTicketsResponse.eventInfo, tickets: buyingTicketsResponse.boughtTickets })
    let pdfBuffer;//TODO: handle if pdf creation fails.
    if (createPDFResponse.success) { pdfBuffer = createPDFResponse.buffer }

    const orderId = buyingTicketsResponse.orderDetails.orderId
    await sendReceiptMail(
        `${WEBSITE_URL}/orders/${orderId}`,
        'noreply@chirotix.com',
        buyingTicketsResponse.orderDetails.buyerInfo.email,
        'ChiroTix order',
        pdfBuffer
    )

    ticketDb.doneBuying(eventId, buyerId)//Change isBuying from true to false.

    return buyingTicketsResponse
}

async function calculatePrice(tickets, insurance) {
    const ticketsPrice = await ticketDb.getTicketsPrice(tickets)

    if (insurance) {
        const percentage = await ticketDb.getInsurancePercentage()
        const insurancePrice = (percentage * ticketsPrice).toFixed(2)
        return {
            totalPrice: (insurancePrice + ticketsPrice).toFixed(2),
            insurancePrice
        }
    } else {
        return { totalPrice: ticketsPrice.toFixed(2) }
    }
}


/**
 * paymentOptions: {
 *      method: String ('borgun' || 'paypal')
 *      Token: String (only if method is borgun)
 *      orderId: String (only if method is paypal)
 * }
 * 
 */
async function handlePayment(paymentOptions, insurance) {
        const price = await calculatePrice(tickets, insurance)
        if(paymentOptions.method === 'borgun'){
            return await handleBorgunPayment(price, paymentOptions.Token, insurance)  
        } else if (paymentOptions.method === 'paypal'){
            return await handlePaypalPayment(price, paymentOptions.orderId, insurance)
        } else {
            return SYSTEM_ERROR
        }
}

async function handleBorgunPayment(price, Token, insurance){
    const orderId = crypto.randomBytes(6).toString('hex').toUpperCase()

    const borgunResult = await fetch('someapihere and private key', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            TransactionType: 'Sale',
            Amount: price.totalPrice,
            Currency: '840', //usd
            TransactionDate: new Date().toISOString(),
            OrderId: orderId,
            PaymentMethod: {
                PaymentType: 'TokenSingle',
                Token: Token
            },
            Metadata: insurance ? {
                insurancePrice: price.insurancePrice
            } : {}
        })
    })

    const borgunData = await borgunResult.json()
}

async function handlePaypalPayment(price, orderId, insurance){
  // 3. Call PayPal to get the transaction details
  let request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);

  let order
  try {
    order = await client().client().execute(request);
  } catch (err) {

    // 4. Handle any errors from the call
    console.error(err);
    return SYSTEM_ERROR
  }

  // 5. Validate the transaction details are as expected
  if (order.result.purchase_units[0].amount.value !== price) {
    return BAD_REQUEST('You did not pay the expected amount')
  }

  // 6. Save the transaction in your database
  // await database.saveTransaction(orderID);

  // 7. Return a successful response to the client
  return order;

}

function client() {
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

/**
 *
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use LiveEnvironment.
 *
 */
function environment() {
    let clientId = process.env.PAYPAL_CLIENT_ID || 'PAYPAL-SANDBOX-CLIENT-ID';
    let clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'PAYPAL-SANDBOX-CLIENT-SECRET';

    if(process.env.PRODUCTION){
        return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
    } else {
        return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
    }
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
async function ticketsReservedMatchBuyerTickets(reservedTickets, tickets) {
    let buyerTicketTypes = []
    let reservedTicketTypes = []

    //Count how many tickets of each type the DB thinks this buyer has reserved.
    for (let i = 0; i < reservedTickets.length; i++) {
        let ticket = reservedTickets[i]
        if (!reservedTicketTypes[ticket.ticketTypeId]) { reservedTicketTypes[ticket.ticketTypeId] = 1 }
        else { reservedTicketTypes[ticket.ticketTypeId]++ }
    }

    //Count how many tickets this buyer is trying to buy.
    for (let i = 0; i < tickets.length; i++) {
        let ticket = tickets[i]
        if (!buyerTicketTypes[ticket.ticketTypeId]) { buyerTicketTypes[ticket.ticketTypeId] = 1 }
        else { buyerTicketTypes[ticket.ticketTypeId]++ }
    }

    //Check that the amount of each ticket type this buyer is trying to buy is the same that the DB thinks he has reserved.
    let ticketTypeIds = Object.keys(buyerTicketTypes)
    for (let i = 0; i < ticketTypeIds.length; i++) {
        let id = ticketTypeIds[i]
        if (buyerTicketTypes[id] != reservedTicketTypes[id]) { return false }
    }
    return true
}



module.exports = { reserveTickets, buyTickets, releaseAllTicketsForBuyer, getEventInfoWithTicketTypes }