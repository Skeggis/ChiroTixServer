require('dotenv').config();
const db = require('./db');
const formatter = require('../formatter')
const { SYSTEM_ERROR } = require('../Messages')
const { DB_CONSTANTS } = require('../helpers')
const crypto = require('crypto');

async function getEventInfoWithTicketTypes(eventId) {
    let query = `select * from ${DB_CONSTANTS.EVENTS_INFO_VIEW} where eventid=${eventId}`
    let result = await db.query(query)
    if (!result.rows[0]) { return false }
    return await formatter.formatEventInfoView(result.rows)
}
/**
 * @param {Integer} eventId
 * @param {String} buyerId
 * @param {Array} tickets : [{
 *                  ticketTypeId: Integer,
 *                  id: Integer, //This is the id of the ticket in the SoldTable!
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
        const {eventInfo} = await formatter.formatEventInfoView(eventInfoResponse.rows)
        const eventTicketsTable = eventInfo.ticketsTableName

        //get the order id by incrementing the latest entry
        const lastOrderNr = await client.query(`select ordernr from ${DB_CONSTANTS.ORDERS_DB} where date = (select max(date) from ${DB_CONSTANTS.ORDERS_DB})`)
        const newOrdrerNr = lastOrderNr.rows[0].ordernr + 1

        //Insert into the orders table
        const ordersQuery = `insert into ${DB_CONSTANTS.ORDERS_DB} (orderid, eventid, receipt, tickets, insurance, insuranceprice, buyerinfo, buyerid, ordernr)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`
        const orderInsertResult = await client.query(ordersQuery,
            [crypto.randomBytes(40).toString('hex'),
                eventId,
            JSON.stringify(receipt),
            JSON.stringify(tickets),
                insurance,
                insurancePrice,
            JSON.stringify(buyerInfo),
            buyerId,
            newOrdrerNr
            ])
        const orderDetails = formatter.formatOrderDetails(orderInsertResult.rows[0])

        let boughtTickets = []
        let ticketTypes = []//Count how many tickets of a certain type the buyer wants to update the ticketsType table later
        //Updating the reservedTickets to isSold=true
        for (let j = 0; j < tickets.length; j++) {
            let ticket = tickets[j]
            //Using ticket.id, not ticket.ticketTypeId, because it is referring to the id in the sold table
            let q = `update ${eventTicketsTable} set (issold, ownerinfo, orderid, termsTitle, termsText) = ($1,$2,$3,$4,$5) where buyerid = '${buyerId}' and id = ${ticket.id} returning *`
            const values = [true, JSON.stringify(ticket.ownerInfo), orderInsertResult.rows[0].orderid, ticket.termsTitle, ticket.termsText]
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

        //Get the bought tickets, returning from the update above was not working, unfortunately. Perhaps because its inside BEGIN/COMMIT?. 
        // let boughtTicketIds = []
        // for (let j = 0; j < tickets.length; j++) { boughtTicketIds.push(tickets[j].id) }
        // query = `Select * from ${eventTicketsTable} where id = Any('{${boughtTicketIds.toString()}}')`
        // let result = await client.query(query)
        // let boughtTickets = await formatter.formatTickets(result.rows)

        const chiroInfoResult = await client.query(`select receiptinfo from ${DB_CONSTANTS.CHIRO_TIX_SETTINGS_DB}`)
        const chiroInfo = chiroInfoResult.rows[0].receiptinfo

        await client.query('COMMIT')

        message.boughtTickets = boughtTickets
        message.orderDetails = orderDetails
        message.eventInfo = eventInfo
        message.success = true
        message.chiroInfo = chiroInfo
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("BuyTickets error: ", e)
        message = SYSTEM_ERROR
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
 * 
 * @param {Array} reservedTicketIds (Integers)
 * @param {Integer} eventId
 * @param {String} buyerId
 */
async function getReservedTickets(reservedTicketIds, eventId, buyerId) {
    let query = `Select * from ${DB_CONSTANTS.EVENTS_DB} where id=${eventId}`
    let result = await db.query(query)
    if (!result.rows[0]) { return false }
    let soldTicketsTableName = result.rows[0].ticketstablename

    query = `Select * from ${soldTicketsTableName} where id=Any('{${reservedTicketIds.toString()}}') and issold=false and buyerid='${buyerId}'`
    result = await db.query(query)
    let reservedTickets = await formatter.formatTickets(result.rows)

    return reservedTickets
}

/**
 * @param {Array} ticketTypeIds : [Integer]
 */
async function getTicketTypes(ticketTypeIds) {
    let query = `select * from ${DB_CONSTANTS.TICKETS_TYPE_DB} where id=Any('{${ticketTypeIds.toString()}}')`
    let ticketTypes = await db.query(query)
    if (!ticketTypes || ticketTypes.length === 0) { return false }
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
    let message = { success: false, messages: [] }

    const client = await db.getClient()
    tryBlock: try {
        await client.query('BEGIN')

        let ownerInfos = []
        for (let j = 0; j < ticketTypes.length; j++) {
            let ticketType = ticketTypes[j]
            let q = `update ${DB_CONSTANTS.TICKETS_TYPE_DB} set reserved = reserved + ${ticketType.amount} where id=${ticketType.id} and amount >= reserved+sold+${ticketType.amount} returning *`
            let qResult = await client.query(q)
            if(!qResult || !qResult.rows[0]){
                await client.query('ROLLBACK')
                message.messages.push({type:"error", message:`Could not reserve your tickets of type ${ticketType.name}`})
                break tryBlock
            }
            ownerInfos.push(ticketType.ownerInfo)
        }
        message.ownerInfos = ownerInfos

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
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("ReserveTickets error: ", e)
        message = SYSTEM_ERROR
    } finally {
        client.end()
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
    if(!reservedTickets || reservedTickets.length === 0){return true}
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
async function releaseTickets(reservedTicketIds, ticketTypesAmount, eventId) {
    let message = {
        success: false,
        messages: []
    }
    const client = await db.getClient()
    try {
        let query = `Select * from ${DB_CONSTANTS.EVENTS_DB} where id=${eventId}`
        const eventInfo = await client.query(query)
        const eventTicketsTable = eventInfo.rows[0].ticketstablename

        await client.query('BEGIN')

        query = `delete from ${eventTicketsTable} where id=Any('{${reservedTicketIds.toString()}}') and issold=false and isbuying = false`
        await client.query(query)

        let ticketTypesIds = Object.keys(ticketTypesAmount)
        for (let i = 0; i < ticketTypesIds.length; i++) {
            let id = ticketTypesIds[i]
            let amount = ticketTypesAmount[id]
            query = `update ${DB_CONSTANTS.TICKETS_TYPE_DB} set reserved = reserved - ${amount} where id = ${id}`
            await client.query(query)
        }

        await client.query('COMMIT')
        message.success = true
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("ReleaseTickets error: ", e)
        message = SYSTEM_ERROR
    } finally {
        client.end()
    }
    return message
}

async function isBuying(eventId, buyerId){
    let isBuyingTickets = false
    const client = await db.getClient()
    try{
        await client.query('BEGIN')
        let query = `Select * from ${DB_CONSTANTS.EVENTS_DB} where id=${eventId}`
        const eventInfo = await client.query(query)
        const eventTicketsTable = eventInfo.rows[0].ticketstablename

        // console.log(`update ${eventTicketsTable} set isbuying=true where issold = false and isbuying = false and buyerid = '${buyerId}' returning *`)
        let result = await client.query(`update ${eventTicketsTable} set isbuying=true where issold = false and isbuying = false and buyerid = '${buyerId}' returning *`)
        console.log(result.rows)
        if(!result.rows[0]){ isBuyingTickets = true }
        await client.query('COMMIT')
    } catch(e){
        console.log(e)
    } finally{
        await client.end()
        return isBuyingTickets
    }
}

async function doneBuying(eventId, buyerId){
    const client = await db.getClient()
    try{
        await client.query('BEGIN')
        let query = `Select * from ${DB_CONSTANTS.EVENTS_DB} where id=${eventId}`
        const eventInfo = await client.query(query)
        const eventTicketsTable = eventInfo.rows[0].ticketstablename

        await client.query(`update ${eventTicketsTable} set isbuying=false where isbuying=true and buyerid = '${buyerId}'`)
        await client.query('COMMIT')
    } catch(e){
        console.log(e)
    } finally{
        await client.end()
    }
}



module.exports = {
    getTicketTypes, reserveTickets, buyTickets, getAllReservedTicketsForBuyer, getReservedTickets,
    releaseTickets, releaseAllTicketsForBuyer, getEventInfoWithTicketTypes, isBuying, doneBuying
}
