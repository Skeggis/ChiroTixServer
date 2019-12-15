require('dotenv').config();
const db = require('./db');
const formatter = require('../formatter')

const {
    TICKETS_TYPE_DB,
    EVENTS_DB
} = process.env;


/**
 * @param {Integer} eventId
 * @param {String} buyerId
 * @param {Array} tickets : [{
 *                  ticketId: Integer,
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
async function buyTickets(eventId, buyerId, tickets, buyerInfo, receipt){
    let message = {
        success: false,
        messages: []
    }
    const client = await db.getClient()
    try {
        await client.query('BEGIN')

        let query = `Select * from ${EVENTS_DB} where id=${eventId}`
        const getEventInfo = await client.query(query)
        const eventTicketsTable = getEventInfo.rows[0].ticketstablename

        for(let j = 0; j < tickets.length; j++){ 
            let ticket = tickets[j]
            let q = `update ${eventTicketsTable} set (issold, buyerinfo, ownerinfo, receipt) = ($1,$2,$3,$4) where buyerid = '${buyerId}' and id = ${ticket.id}`//This is ticket.id because it is referring to the id in the sold table
            const values = [true, buyerInfo, ticket.ownerInfo, receipt]
            await client.query(q, values)   
        }

         //Count how many tickets of a certain type the buyer wants
         let ticketTypes = []
         for(let j = 0; j < tickets.length; j++){  
             let ticket = tickets[j]
            if(!ticketTypes[ticket.ticketId]) { ticketTypes[ticket.ticketId] = 1 }
            else { ticketTypes[tickets[j].ticketId]++ }
        }
 
        //Update the TicketType DB, i.e. remove the reserved tickets from reserved to sold.
         let ticketTypeIds = Object.keys(ticketTypes)
         for(let j = 0; j < ticketTypeIds.length; j++){
             let ticketId = ticketTypeIds[j]
             let q = `update ${TICKETS_TYPE_DB} set reserved = reserved - ${ticketTypes[ticketId]}, sold = sold + ${ticketTypes[ticketId]} where id = ${ticketId}`
             await client.query(q) 
         }

        //Get the bought tickets, update and returning was not working, unfortunate. 
        let boughtTicketIds = []
        for(let j = 0; j < tickets.length; j++){ boughtTicketIds.push(tickets[j].id) }
        query = `Select * from ${eventTicketsTable} where id = Any('{${boughtTicketIds.toString()}}')`
        let result = await client.query(query)
        let boughtTickets = await formatter.formatTickets(result.rows)

        await client.query('COMMIT')
        message.boughtTickets = boughtTickets
        message.success = true
      } catch (e) {
        await client.query('ROLLBACK')
        console.log("BuyTickets error: ", e)
        message.messages.push({type: "Error", message: "System error. Please try again later."})
      } finally {
        client.end()
      }
      return message
}

/**
 * @param {Integer} eventId
 * @param {String} buyerId 
 */
async function getAllReservedTicketsForBuyer(buyerId, eventId){
    let query = `Select * from ${EVENTS_DB} where id=${eventId}`
    let result = await db.query(query)
    if(!result.rows[0]) {return null}
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
async function getReservedTickets(reservedTicketIds, eventId, buyerId){
    let query = `Select * from ${EVENTS_DB} where id=${eventId}`
    let result = await db.query(query)
    if(!result.rows[0]) {return null}
    let soldTicketsTableName = result.rows[0].ticketstablename

    query = `Select * from ${soldTicketsTableName} where id=Any('{${reservedTicketIds.toString()}}') and issold=false and buyerid='${buyerId}'`
    result = await db.query(query)
    let reservedTickets = await formatter.formatTickets(result.rows)

    return reservedTickets
}

/**
 * @param {Array} ticketIds : [Integer]
 */
async function getTicketTypes(ticketIds){
    let query = `select * from ${TICKETS_TYPE_DB} where id=Any('{${ticketIds.toString()}}')`
    let ticketTypes = await db.query(query)
    return await formatter.formatTicketTypes(ticketTypes.rows)
}

/**
 * @param {Integer} eventId
 * @param {String} buyerId
 * @param {Array} tickets : [{
 *                  ticketId: Integer,
 *                  amount: Integer
 *              }]
 */
async function reserveTickets(eventId, buyerId, tickets){
    let message = {
        success: false,
        messages: []
    }
    const client = await db.getClient()
    try {
        await client.query('BEGIN')

        for(let j = 0; j < tickets.length; j++){ 
            let ticket = tickets[j]
            let q = `update ${TICKETS_TYPE_DB} set reserved = reserved + ${ticket.amount} where id=${ticket.ticketId} returning *`
            await client.query(q) 
        }
        let query = `Select * from ${EVENTS_DB} where id=${eventId}`
        const getEventInfo = await client.query(query)

        const eventTicketsTable = getEventInfo.rows[0].ticketstablename

        let multipleInsertQuery = `insert into ${eventTicketsTable} (eventid, ticketid, buyerid) values`
        for(let j = 0; j < tickets.length; j++){
            let ticket = tickets[j] 
            for(let i = 0; i < ticket.amount; i++){
                multipleInsertQuery += ` (${eventId}, ${ticket.ticketId}, '${buyerId}')`
                if(j < tickets.length-1 || i < ticket.amount-1){multipleInsertQuery += ","}
                else {multipleInsertQuery += " returning *;"}
            }
        }
        let result = await client.query(multipleInsertQuery) 
        message.reservedTickets = await formatter.formatTickets(result.rows)
        await client.query('COMMIT')
        message.success = true
      } catch (e) {
        await client.query('ROLLBACK')
        // console.log("ReserveTickets error: ", e)
        message.messages.push({type: "Error", message: "System error. Please try again later."})
      } finally {
        client.end()
      }
      return message
}

/**
 * 
 * @param {Array} reservedTicketIds (Integers)
 * @param {Integer} eventId
 * @param {Object} ticketTypesAmount : [String:Integer]
 */
async function releaseTickets(reservedTicketIds, ticketTypesAmount, eventId){
    let message = {
        success: false,
        messages: []
    }
    const client = await db.getClient()
    try {
        await client.query('BEGIN')
        let query = `Select * from ${EVENTS_DB} where id=${eventId}`
        const getEventInfo = await client.query(query)
        const eventTicketsTable = getEventInfo.rows[0].ticketstablename

        query = `delete from ${eventTicketsTable} where id=Any('{${reservedTicketIds.toString()}}') and issold=false`
        await client.query(query)

        let ticketTypesIds = Object.keys(ticketTypesAmount)
        for(let i = 0; i < ticketTypesIds.length; i++){
            let id = ticketTypesIds[i]
            let amount = ticketTypesAmount[id]
            query = `update ${TICKETS_TYPE_DB} set reserved = reserved - ${amount} where id = ${id}`
            await client.query(query)
        }
        
        await client.query('COMMIT')
        message.success = true
      } catch (e) {
        await client.query('ROLLBACK')
        // console.log("ReserveTickets error: ", e)
        message.messages.push({type: "Error", message: "System error. Please try again later."})
      } finally {
        client.end()
      }
      return message
}



module.exports = {getTicketTypes, reserveTickets, buyTickets, getAllReservedTicketsForBuyer, getReservedTickets,
                    releaseTickets}