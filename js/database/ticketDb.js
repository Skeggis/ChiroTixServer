require('dotenv').config();
import { query as _query, getClient as _getClient } from './db';
import { ticketTypeFormatter as _ticketTypeFormatter } from '../formatter'

const {
    TICKETS_TYPE_DB,
    EVENTS_DB
} = process.env;



/**
 * 
 * @param {Array} tickets :[{
 *                  price: Double,
 *                  name: String,
 *                  amount: Integer
 *          }]
 */
async function insertTicketTypes(tickets) {
    let success = false
    try {
        const client = await _getClient()
        await client.query('BEGIN')

        let query = `insert into ${TICKETS_TYPE_DB} (price, name, amount) values`
        for (let j = 1; j <= tickets.length; j++) {
            let ticket = tickets[j]
            query += ` (${ticket.price}, ${ticket.name}, ${ticket.amount})`
            if (j < tickets.length) { query += "," }
        }

        await client.query(query)
        await client.query('COMMIT')
        success = true
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.end()
    }
    return success
}

/**
 * @param {Integer} eventId
 * @param {String} buyerId
 * @param {Array} tickets : [{
 *                  ticketId: Integer,
 *                  owner: {
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
async function buyTickets(eventId, buyerId, tickets, buyerInfo) {

}

/**
 * @param {Integer} eventId
 * @param {String} buyerId
 * @param {Array} tickets : [{
 *                  ticketId: Integer,
 *                  amount: Integer
 *              }]
 */
async function findTickets(eventId, buyerId, tickets) {
    let success = false
    let ticketIds = []
    for (let ticket in tickets) {
        ticketIds.push(ticket.ticketId)
    }

    let query = `select * from ${TICKETS_TYPE_DB} where id=Any('{${ticketIds.toString()}}')`
    let ticketTypes = await _query(query)

    if (!ticketTypes.rows[0]) {
        return null//Could not find these tickets! TODO: Error handle
    }

    let ticketsNotFound = []
    for (let ticket in tickets) {
        for (let ticketType in ticketTypes.rows) {
            if (ticket.ticketId === ticketType.id) {
                let ticketsLeft = ticketType.amount - (ticketType.reserved + ticketType.sold)
                if (ticketsLeft <= 0 || ticketsLeft < ticket.amount) {
                    ticketsNotFound.push({
                        message: (ticketsLeft <= 10 ? `There are only ${ticketsLeft} ` : `There are fewer than ${ticket.amount} `) + `tickets left of type: ${ticketType.name}.\n`
                    })
                }
            }
        }
    }
    let ticketsNotFound = await ticketsExist(tickets)
    if (!ticketsNotFound || ticketsNotFound.length > 0) { return null/*Handle too few tickets for your purchase. TODO: Error handle*/ }
    return success
}

/**
 * @param {Integer} eventId
 * @param {String} buyerId
 * @param {Array} tickets : [{
 *                  ticketId: Integer,
 *                  amount: Integer
 *              }]
 */
async function reserveTickets(eventId, buyerId, tickets) {
    let success = false
    try {
        const client = await _getClient()
        await client.query('BEGIN')

        for (let ticket in tickets) { await client.query(`update ${TICKETS_TYPE_DB} set reserved = reserved + ${ticket.amount} returning *`) }

        const getEventInfo = await query(`Select * from ${EVENTS_DB} where id=${eventId}`)
        const eventTicketsTable = getEventInfo.rows[0].ticketsdbname

        let multipleInsertQuery = `insert into ${eventTicketsTable} (eventid, ticketid, buyerid) values`
        for (let j = 1; j <= tickets.length; j++) {
            let ticket = tickets[j]
            for (let i = 0; i < ticket.amount; i++) {
                multipleInsertQuery += ` (${eventId}, ${ticket.ticketId}, '${buyerId}')`
                if (j < tickets.length) { multipleInsertQuery += "," }
            }
        }

        await client.query(multipleInsertQuery)
        await client.query('COMMIT')
        success = true
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.end()
    }
    return success
}

module.exports = { findTickets, reserveTickets, insertTicketTypes }