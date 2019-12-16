const {
  query,
  getClient
} = require('./db');
const formatter = require('../formatter')
const util = require('util');
const fs = require('fs');
const readFileAsync = util.promisify(fs.readFile);


const {
  EVENTS_DB,
  TICKETS_TYPE_DB,
  SPEAKERS_DB,
  SPEAKERS_CONNECT_DB
} = process.env

async function getEventsDb() {
  return await query(`SELECT * FROM ${EVENTS_DB}`);
}

async function insertEventDb(event) {
  const myEvent = {
    name: event.name,
    date: event.date,
    shortdescription: event.shortDescription,
    longdescription: event.longDescription,
    image: event.image,
    locationid: event.locationId,
    longitude: event.longitude,
    latitude: event.latitude
  }
  let speakers = event.speakers //[{name:String, id: Integer (iff speaker exists in our db)}]
  console.log(event)

  let success = false
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const eventQuery = `INSERT INTO ${EVENTS_DB} (name, date, shortdescription, longdescription, image, locationid, longitude, latitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`
    const eventRes = await client.query(eventQuery, Object.values(myEvent))

    const ticketValues = []
    event.tickets.forEach(ticket => {
      ticketValues.push(ticket.price, ticket.name, ticket.amount)
    })
    let ticketQuery = `insert into ${TICKETS_TYPE_DB} (price, name, amount, eventid) values`
    let counter = 1;
    for (let j = 0; j < event.tickets.length; j++) {
      ticketQuery += ` ($${counter}, $${counter + 1}, $${counter + 2}, ${eventRes.rows[0].id})`
      if (j < event.tickets.length - 1) {
        ticketQuery += ","
      }
      counter += 3
    }
    ticketQuery += ' RETURNING *'
    console.log(ticketQuery)
    console.log(ticketValues)
    await client.query(ticketQuery, ticketValues)

    const soldTicketsTable = await readFileAsync('./sql/ticketsSold.sql')
    const ticketsSoldTableName = `ticketssold_${eventRes.rows[0].id}`
    await client.query(`CREATE TABLE ${ticketsSoldTableName} ${soldTicketsTable.toString('utf8')}`)

    await client.query(`UPDATE ${EVENTS_DB} SET ticketstablename = '${ticketsSoldTableName}' WHERE id = ${eventRes.rows[0].id}`)//TODO: Move into the original insert?

    let newSpeakers = []
    let insertNewSpeakersQuery = `insert into ${SPEAKERS_DB} (name) values`
    let oldSpeakers = []
    speakers.forEach((speaker,i) => {
      if(speaker.id){oldSpeakers.push(speaker)}
      else {
        newSpeakers.push(speaker)
        if(newSpeakers.length != 0) {insertNewSpeakersQuery+=","}
        insertNewSpeakersQuery += ` ('${speaker.name}')`
      }
    })
    
    let theSpeakers = []
    if(newSpeakers.length != 0){
      let newSpeakersResult = await client.query(insertNewSpeakersQuery)
      theSpeakers = await formatter.formatSpeakers(newSpeakersResult.rows)
    }

    let theSpeakers = oldSpeakers.concat(theSpeakers)

    let connectSpeakersToEventQuery = `insert into ${SPEAKERS_CONNECT_DB} (eventid, speakerid) values`
    theSpeakers.forEach((speaker, i) => {
      if(i != 0) { connectSpeakersToEventQuery += ","}
      else { connectSpeakersToEventQuery += ` (${eventRes.rows[0].id}, ${speaker.id})`}
     })

     await client.query(connectSpeakersToEventQuery)

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

async function updateEventDb(id, event) {

  let success = false
  const client = await getClient()
  try {
    await client.query('BEGIN')//TODO: change into a single query, i.e. no BEGIN nor ROLLBACK. ?
    let t = ''
    let counter = 0
    Object.keys(event).forEach(key => {
      t += `${key} = $${counter + 1} `
      if (counter < Object.keys(event).length - 1) {
        t += ', '
      }
      counter += 1
    });
    let q = `UPDATE ${EVENTS_DB} set ${t} WHERE id = $${counter += 1}`
    await client.query(q, [...Object.values(event), id])




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

async function updateTicketsTypeDb(id, tickets) {
  let newTickets = []
  let newTicketsValues = []
  let oldTickets = []
  let oldTicketsValues = []
  tickets.filter(ticket => {
    if (ticket.id) {//Perhaps instead have a old/new key which is true/false, improves readability?
      const myTicket = {
        id: ticket.id,
        name: ticket.name,
        price: ticket.price,
        amount: ticket.amount,
      }
      oldTickets.push(myTicket)
      oldTicketsValues.push(...Object.values(myTicket))
    } else {
      const myTicket = {
        name: ticket.name,
        price: ticket.price,
        amount: ticket.amount,
      }
      newTickets.push(myTicket)
      newTicketsValues.push(...Object.values(myTicket))
    }
  })

  let success = false
  const client = await getClient()
  try {
    await client.query('BEGIN')

    //You can always add new tickets, even if event has started
    //new tickets
    if (newTickets.length > 0) {
      let newTicketsQuery = `INSERT INTO ${TICKETS_TYPE_DB} (name, price, amount, eventid) values`
      let counter = 2;
      for (let i = 0; i < newTickets.length; i += 1) {
        newTicketsQuery += `($${counter}, $${counter + 1}, $${counter + 2}, $1)`
        if (i < newTickets.length - 1) {
          newTicketsQuery += ','
        }
        counter += 3
      }
      console.log(newTicketsQuery)
      console.log(newTicketsValues)
      await client.query(newTicketsQuery, [id, ...newTicketsValues])
    }

    const ticketErrors = []
    if (oldTickets.length > 0) {
      const currentSellingTime = await client.query(`SELECT startsellingtime FROM ${EVENTS_DB} WHERE id = $1`, [id])
      if (new Date(currentSellingTime.rows[0].startsellingtime) < new Date()) {
        //The event has started selling tickets. Can not change name or price of ticket, 
        //but allowed to change amount based on how many are sold and reserved and allowd to add a new ticket
        oldTickets.forEach(async ticket => {
          if (ticket.name) {
            ticketErrors.push({ ticketId: ticket.id, message: 'You can not change the name of a ticket that has started selling' })
          } else if (ticket.price) {
            ticketErrors.push({ ticketId: ticket.id, message: 'You can not change the price of a ticket that has startd selling' })
          } else if (ticket.amount) {
            //check if ticket exists:
            const check = await client.query(`SELECT * FROM ${TICKETS_TYPE_DB} WHERE id = $1`, [ticket.id])
            if (check.rowCount === 0) {
              ticketErrors.push({
                message: 'This ticket does not exist',
                ticketId: ticket.id
              })
            } else {
              //Lets check the min number of tickets the user can change to
              const ticketsTableName = await client.query(`SELECT ticketstablename FROM ${EVENTS_DB} WHERE id = $1`, [id])
              const soldOrReserved = await client.query(`SELECT * FROM ${ticketsTableName.rows[0].ticketstablename}`) //ticket is inserted into table if it is reserved

              if (ticket.amount >= soldOrReserved.rowCount) {
                const amountQuery = `UPDATE ${TICKETS_TYPE_DB} SET amount = $1 WHERE id = $2`
                const result = await client.query(amountQuery, [ticket.amount, ticket.id])
              } else {
                ticketErrors.push({
                  ticketId: ticket.id,
                  message: `The minumum ticket amount is ${soldOrReserved.rowCount} because the ticket has started selling`
                })
              }
            }
          }
        })

      } else {//Ticket has not started selling so you can update everything about it
        oldTickets.forEach(async ticket => {
          //check if ticket exists
          const check = await client.query(`SELECT * FROM ${TICKETS_TYPE_DB} WHERE id = $1`, [ticket.id])
          if (check.rowCount === 0) {
            ticketErrors.push({
              ticketId: ticket.id,
              message: 'This ticket does not exist'
            })
          } else {
            myTicket = {
              name: ticket.name || null, //Can you set name as null ? TODO
              amount: ticket.amount || null,
              price: ticket.price || null
            }
            let t
            const values = []
            Object.keys(ticket).forEach((key, index) => {
              if (ticket[key]) {
                t += `${key} = $${index + 2}`
                if (index < values.length - 1) { t += ',' }
                values.push(ticket[key])
              }
            })
            const q = `UPDATE ${TICKETS_TYPE_DB} SET ${t} where id = $1`
            await client.query(q, [ticket.id, ...values])
          }

        })
      }
    }

    if (ticketErrors.length > 0) {
      return {
        success: false,
        messages: ticketErrors
      }
    }



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

async function getEventByIdDb(id) {
  const result = await query(`SELECT * FROM ${EVENTS_DB} WHERE id = $1`, [id])
  return result
}


async function getEventsDb() {
  return await query(`SELECT * FROM ${EVENTS_DB}`);
}



module.exports = {
  getEventsDb,
  insertEventDb,
  getEventByIdDb,
  updateEventDb,
  updateTicketsTypeDb
}