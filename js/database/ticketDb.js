require('dotenv').config();
const db = require('./db');
const formatter = require('../formatter')
const { SYSTEM_ERROR } = require('../Messages')
const { DB_CONSTANTS } = require('../helpers')
const crypto = require('crypto');

async function isEventEligibleForSale(eventId){
    let query = `select * from ${DB_CONSTANTS.EVENTS_DB} where id = ${eventId}`
    let result = await db.query(query)
    if(!result.rows[0]){return SYSTEM_ERROR()}
    let event = await formatter.formatEventFromEventsTable(result.rows[0])
    if(!event.isSelling) { return {success: false, messages:[{message:"This event is not in sale at the moment. Please check when it will be in sale and try again.", type:"error" }]}}
    if(event.isSoldOut){ return {success: false, messages:[{message:"This event is sold out.", type:"error"}]}}
    if(!event.isVisible){ return {success: false, messages:[{message:"This event is not available for sale.", type:"error"}]}}
    return {success: true}
}

async function getEventInfoWithTicketTypes(eventId) {
    let query = `select * from ${DB_CONSTANTS.EVENTS_INFO_VIEW} where eventid=${eventId} and isvisible = true`
    let client = await db.getClient()
    let message = {}
    try {
        await client.query('BEGIN')

        let result = await client.query(query)
        if (!result.rows[0]) { return {success: false, messages:[{message:"Could not find the event you are looking for.", type:"error"}]} }

        message.event = await formatter.formatEventInfoView(result.rows)
        console.log(message.event.ticketTypes)
        if(!message.event.eventInfo.isSelling) { return {success: false, messages:[{message:"This event is not in sale at the moment. Please check when it will be in sale and try again.", type:"error" }]}}
        if(message.event.eventInfo.isSoldOut){ return {success: false, messages:[{message:"This event is sold out.", type:"error"}]}}
        
        
        const insurance = await client.query(`select insurancepercentage from ${CHIRO_TIX_SETTINGS_DB}`)
        message.insurancePercentage = insurance.rows[0].insurancepercentage
        
        await client.query('COMMIT')
        message.success = true
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("BuyTickets error: ", e)
        return SYSTEM_ERROR()
    } finally {
        client.end()
    }
    console.log("RETURNING:", message)
    return message
}
/**
 * @param {Integer} eventId
 * @param {String} buyerId
 * @param {Array} tickets : [{
 *                  ticketTypeId: Integer,
 *                  id: Integer, //This is the id of the ticket in the SoldTable!
 *                  ownerInfo: [{
 *                          label: String,
 *                          value: String
 *                      }]
 *              }]
 * @param {JSON} buyerInfo : {
 *                      name: String,
 *                      email: String,
 *                      SSN: String (?)
 *                  }    
 * 
 * @param {JSON} receipt : {}
 */
async function buyTickets(eventId, buyerId, tickets, buyerInfo, receipt, insurance, insurancePrice) {
    let message = {
        success: false,
        messages: []
    }
    const client = await db.getClient()
    try {
        await client.query('BEGIN')

        let eventInfoQuery = `Select * from ${DB_CONSTANTS.EVENTS_INFO_VIEW} where eventid=${eventId}`
        let eventInfoResponse = await client.query(eventInfoQuery)
        const { eventInfo } = await formatter.formatEventInfoView(eventInfoResponse.rows)
        const eventTicketsTable = eventInfo.ticketsTableName

        //get the order id by incrementing the latest entry
        const lastOrderNr = await client.query(`select ordernr from ${DB_CONSTANTS.ORDERS_DB} where date = (select max(date) from ${DB_CONSTANTS.ORDERS_DB})`)
        const newOrdrerNr = lastOrderNr.rows[0].ordernr + 1
        console.log('receipt: ', receipt)
        console.log('stringified receipt: ', JSON.stringify(receipt))
        //Insert into the orders table
        const ordersQuery = `insert into ${DB_CONSTANTS.ORDERS_DB} (orderid, eventid, receipt, tickets, insurance, buyerinfo, buyerid, ordernr, insuranceprice)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`
        const orderInsertResult = await client.query(ordersQuery,
            [crypto.randomBytes(6).toString('hex').toUpperCase(), //todo: insert orderid from receipt
                eventId,
            JSON.stringify(receipt),
            JSON.stringify(tickets),
                insurance,
            JSON.stringify(buyerInfo),
                buyerId,
                newOrdrerNr,
                parseFloat(insurancePrice)
            ])
        const orderDetails = await formatter.formatOrderDetails(orderInsertResult.rows[0])

        let boughtTickets = []
        let ticketTypes = []//Count how many tickets of a certain type the buyer wants to update the ticketsType table later
        //Updating the reservedTickets to isSold=true
        for (let j = 0; j < tickets.length; j++) {
            let ticket = tickets[j]
            //Using ticket.id, not ticket.ticketTypeId, because it is referring to the id in the sold table
            let q = `update ${eventTicketsTable} set (issold, ownerinfo, orderid, termsTitle, termsText, buyerinfo) = ($1,$2,$3,$4,$5,$6) where buyerid = '${buyerId}' and id = ${ticket.id} returning *`
            const values = [true, JSON.stringify(ticket.ownerInfo), orderInsertResult.rows[0].orderid, ticket.termsTitle, ticket.termsText, JSON.stringify(buyerInfo)]
            let boughtResult = await client.query(q, values)
            boughtTickets.push(await formatter.formatTicket(boughtResult.rows[0]))

            if (!ticketTypes[ticket.ticketTypeId]) { ticketTypes[ticket.ticketTypeId] = 1 }
            else { ticketTypes[tickets[j].ticketTypeId]++ }
        }

        //Update the TicketType DB, i.e. remove the reserved tickets from reserved to sold.
        let ticketTypeIds = Object.keys(ticketTypes)
        for (let j = 0; j < ticketTypeIds.length; j++) {
            let ticketTypeId = ticketTypeIds[j]
            let q = `update ${DB_CONSTANTS.TICKETS_TYPE_DB} set reserved = reserved - ${ticketTypes[ticketTypeId]}, sold = sold + ${ticketTypes[ticketTypeId]} where id = ${ticketTypeId}`
            await client.query(q)
        }

        const chiroInfoResult = await client.query(`select receiptinfo from ${DB_CONSTANTS.CHIRO_TIX_SETTINGS_DB}`)
        const ticketTermsTitle = chiroInfoResult.rows[0].ticketstermstitle
        const ticketTermsText = chiroInfoResult.rows[0].ticketstermstext
        const receiptInfo = chiroInfoResult.rows[0].receiptinfo

        await client.query('COMMIT')

        message.boughtTickets = boughtTickets
        message.orderDetails = orderDetails
        message.eventInfo = eventInfo
        message.success = true
        message.chiroInfo = {receiptInfo, ticketTermsTitle, ticketTermsText}
        delete message.messages
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("BuyTickets error: ", e)
        message = SYSTEM_ERROR()
    } finally {
        client.end()
    }
    return message
}

/**
 * @param {Integer} eventId
 * @param {String} buyerId 
 */
async function getAllReservedTicketsForBuyer(buyerId, eventId) {
    let query = `Select * from ${DB_CONSTANTS.EVENTS_DB} where id=${eventId}`
    let result = await db.query(query)
    if (!result || !result.rows[0]) { return false }

    let soldTicketsTableName = result.rows[0].ticketstablename

    query = `Select * from ${soldTicketsTableName} where buyerid='${buyerId}' and issold=false`
    result = await db.query(query)
    let reservedTickets = await formatter.formatTickets(result.rows)

    return reservedTickets
}

/**
 * @param {Array} ticketTypeIds : [Integer]
 */
async function getTicketTypes(ticketTypeIds, eventId) {
    let query = `select * from ${DB_CONSTANTS.TICKETS_TYPE_DB} where id=Any('{${ticketTypeIds.toString()}}') and eventid=${eventId} and disabled = false`
    let ticketTypes = await db.query(query)
    if (!ticketTypes || ticketTypes.rows.length === 0) { return false }
    return await formatter.formatTicketTypes(ticketTypes.rows)
}

//Admin Func
async function getTicketTypesOfEvent(id) {
    let query = `select * from ${DB_CONSTANTS.TICKETS_TYPE_DB} where eventid=${id}`
    let ticketTypes = await db.query(query)
    if (!ticketTypes || ticketTypes.rows.length === 0) { return false }
    return await formatter.formatTicketTypes(ticketTypes.rows)
}

/**
 * @param {Integer} eventId
 * @param {String} buyerId
 * @param {Array} ticketTypes : [{
 *                  id: Integer,
 *                  amount: Integer
 *              }]
 */
async function reserveTickets(eventId, buyerId, ticketTypes) {
    if (!(buyerId && eventId && ticketTypes && ticketTypes.length > 0)) { return { success: false, messages: [{ type: "error", message: "Invalid request. Please try again later." }] } }
    let message = { success: false, messages: [] }

    const client = await db.getClient()
    tryBlock: try {
        await client.query('BEGIN')

        for (let j = 0; j < ticketTypes.length; j++) {
            let ticketType = ticketTypes[j]
            let q = `update ${DB_CONSTANTS.TICKETS_TYPE_DB} set reserved = reserved + ${ticketType.amount} where id=${ticketType.id} and amount >= reserved+sold+${ticketType.amount} and eventid=${eventId} returning *`
            let qResult = await client.query(q)
            if (!qResult || !qResult.rows[0]) {
                await client.query('ROLLBACK')
                message.messages.push({ type: "error", message: `Could not reserve your tickets of type ${ticketType.name}` })
                break tryBlock
            }
            ticketTypes[j].price = qResult.rows[0].price
            ticketTypes[j].name = qResult.rows[0].name
        }

        let query = `Select * from ${DB_CONSTANTS.EVENTS_DB} where id=${eventId}`
        const eventInfo = await client.query(query)
        const eventTicketsTable = eventInfo.rows[0].ticketstablename

        const ticketValues = []
        let multipleInsertQuery = `insert into ${eventTicketsTable} (eventid, tickettypeid, buyerid, price, name, ownerinfo) values`
        let counter = 1
        for (let j = 0; j < ticketTypes.length; j++) {
            let ticketType = ticketTypes[j]
            for (let i = 0; i < ticketType.amount; i++) {
                multipleInsertQuery += ` (${eventId}, ${ticketType.id}, '${buyerId}', ${ticketType.price}, '${ticketType.name}', $${counter})`
                if (j < ticketTypes.length - 1 || i < ticketType.amount - 1) { multipleInsertQuery += "," }
                else { multipleInsertQuery += " returning *;" }
                ticketValues.push(JSON.stringify(ticketType.ownerInfo))
                counter += 1
            }
        }

        let result = await client.query(multipleInsertQuery, ticketValues)
        message.reservedTickets = await formatter.formatTickets(result.rows)

        await client.query('COMMIT')
        message.success = true
        delete message.messages
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("ReserveTickets error: ", JSON.stringify(e))
        message = SYSTEM_ERROR()
        // message = {success:false, messages:[{type:"error", message:"FUCKER"}]}
    } finally {
        await client.end()
    }
    return message
}


/**
 * 
 * @param {String} buyerId 
 * @param {Integer} eventId
 */
async function releaseAllTicketsForBuyer(buyerId, eventId) {
    let success = false
    let reservedTickets = await getAllReservedTicketsForBuyer(buyerId, eventId)
    if (!reservedTickets || reservedTickets.length === 0) { return true }
    //Count how many tickets of each type this buyer had reserved
    let reservedTicketTypesAmount = []
    for (let i = 0; i < reservedTickets.length; i++) {
        let ticket = reservedTickets[i]
        if (!reservedTicketTypesAmount[ticket.ticketTypeId]) { reservedTicketTypesAmount[ticket.ticketTypeId] = 1 }
        else { reservedTicketTypesAmount[ticket.ticketTypeId]++ }
    }

    const client = await db.getClient()
    try {
        let query = `Select * from ${DB_CONSTANTS.EVENTS_DB} where id=${eventId}`
        const eventInfo = await client.query(query)
        const eventTicketsTable = eventInfo.rows[0].ticketstablename

        await client.query('BEGIN')
        query = `delete from ${eventTicketsTable} where buyerId='${buyerId}' and issold=false and isbuying=false`
        await client.query(query)

        //Update ticketTypes DB
        let ticketTypesIds = Object.keys(reservedTicketTypesAmount)
        for (let i = 0; i < ticketTypesIds.length; i++) {
            let id = ticketTypesIds[i]
            let amount = reservedTicketTypesAmount[id]
            query = `update ${DB_CONSTANTS.TICKETS_TYPE_DB} set reserved = reserved - ${amount} where id = ${id}`
            await client.query(query)
        }

        await client.query('COMMIT')
        success = true
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("ReserveTickets error: ", e)
    } finally {
        client.end()
    }
    return success
}

/**
 * 
 * @param {Array} reservedTicketIds (Integers)
 * @param {Integer} eventId
 * @param {Object} ticketTypesAmount : [String:Integer]
 */
// async function releaseTickets(reservedTicketIds, ticketTypesAmount, eventId) {
//     let message = {
//         success: false,
//         messages: []
//     }
//     const client = await db.getClient()
//     try {
//         let query = `Select * from ${DB_CONSTANTS.EVENTS_DB} where id=${eventId}`
//         const eventInfo = await client.query(query)
//         const eventTicketsTable = eventInfo.rows[0].ticketstablename

//         await client.query('BEGIN')

//         query = `delete from ${eventTicketsTable} where id=Any('{${reservedTicketIds.toString()}}') and issold=false and isbuying=false`
//         await client.query(query)

//         let ticketTypesIds = Object.keys(ticketTypesAmount)
//         for (let i = 0; i < ticketTypesIds.length; i++) {
//             let id = ticketTypesIds[i]
//             let amount = ticketTypesAmount[id]
//             query = `update ${DB_CONSTANTS.TICKETS_TYPE_DB} set reserved = reserved - ${amount} where id = ${id}`
//             await client.query(query)
//         }

//         await client.query('COMMIT')
//         message.success = true
//     } catch (e) {
//         await client.query('ROLLBACK')
//         console.log("ReleaseTickets error: ", e)
//         message = SYSTEM_ERROR
//     } finally {
//         client.end()
//     }
//     return message
// }

async function isBuying(eventId, buyerId) {
    let isBuyingTickets = false
    const client = await db.getClient()
    try {
        await client.query('BEGIN')
        let query = `Select * from ${DB_CONSTANTS.EVENTS_DB} where id=${eventId}`
        const eventInfo = await client.query(query)
        const eventTicketsTable = eventInfo.rows[0].ticketstablename

        let result = await client.query(`update ${eventTicketsTable} set isbuying=true where issold = false and isbuying = false and buyerid = '${buyerId}' returning *`)
        if (!result.rows[0]) { isBuyingTickets = true }
        await client.query('COMMIT')
    } catch (e) {
        console.log(e)
    } finally {
        await client.end()
        return isBuyingTickets
    }
}

async function updateEventSoldOutState(eventId){
    let query = `select * from ${DB_CONSTANTS.TICKETS_TYPE_DB} where eventid = ${eventId}`
    const client = await db.getClient()

    try{
        await client.query('BEGIN')
        let result = await client.query(query)
        if(result.rows[0]){
            let soldOut = true
            for(let i = 0; i < result.rows.length; i++){
                let ticket = result.rows[i]
                if(ticket.amount > ticket.sold){
                    soldOut = false
                    break
                }
            }
            if(soldOut){
                query = `update ${DB_CONSTANTS.EVENTS_DB} set issoldout = true where id = ${eventId} and issoldout = false`
                await client.query(query)
                query = `update ${DB_CONSTANTS.SEARCH_EVENTS_DB} set issoldout = true where eventid = ${eventId} and issoldout = false`
                await client.query(query)
            }
        }
        await client.query('COMMIT')

    } catch(e){
        console.log("update sold out state error:", e)
        await client.query('ROLLBACK')
    } finally{
        await client.end()
    }
}

async function doneBuying(eventId, buyerId) {
    const client = await db.getClient()
    try {
        await client.query('BEGIN')
        let query = `Select * from ${DB_CONSTANTS.EVENTS_DB} where id=${eventId}`
        const eventInfo = await client.query(query)
        const eventTicketsTable = eventInfo.rows[0].ticketstablename
        await client.query(`update ${eventTicketsTable} set isbuying=false where isbuying=true and buyerid = '${buyerId}'`)
        await client.query('COMMIT')

    } catch (e) {
        console.log(e)
    } finally {
        await client.end()
    }
}

async function getAllTicketsSoldIn(ticketsTableName) {
    let query = `SELECT *, t.date as reserveddate, t.ownerinfo as ownerdata FROM ${ticketsTableName} AS t INNER JOIN ${DB_CONSTANTS.TICKETS_TYPE_DB} AS ti ON t.tickettypeid = ti.id;`
    let result = await db.query(query)
    return await formatter.formatTickets(result.rows)
}

async function getTicketsPrice(tickets) {
    const client = await db.getClient()
    let price = 0;
    console.log(tickets)
    try {
        await client.query('BEGIN')


        for (let i = 0; i < tickets.length; i++) {
            const result = await client.query(`select price from ${TICKETS_TYPE_DB} where id = $1`, [tickets[i].ticketTypeId])
            price += parseFloat(result.rows[0].price)
        }

        await client.query('COMMIT')
    } catch (e) {
        console.log(e)
    } finally {
        await client.end()
    }
    return price
}

async function getInsurancePercentage() {
    const result = await db.query(`select insurancepercentage from ${CHIRO_TIX_SETTINGS_DB}`)
    return result.rows[0].insurancepercentage
}

async function changeTicketState(ticketTypeId){
    const result = await db.query(`update ${DB_CONSTANTS.TICKETS_TYPE_DB} set disabled = not disabled where id = ${ticketTypeId} returning *`)
    return result.rows[0]
}



module.exports = {
    getTicketTypes, reserveTickets, buyTickets, getAllReservedTicketsForBuyer,
    releaseAllTicketsForBuyer, getEventInfoWithTicketTypes, isBuying, doneBuying,
    getTicketTypesOfEvent, getAllTicketsSoldIn, getTicketsPrice, getInsurancePercentage,
    changeTicketState, isEventEligibleForSale, updateEventSoldOutState
}
