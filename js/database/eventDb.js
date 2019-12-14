const {
  query,
  getClient
} = require('./db');

const util = require('util');
const fs = require('fs');
const readFileAsync = util.promisify(fs.readFile);


const {
  EVENTS_DB,
  TICKETS_CONNECT_DB,
  TICKETS_TYPE_DB
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
    latitude: event.latitude,
  }
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

    await client.query(`UPDATE ${EVENTS_DB} SET ticketstablename = '${ticketsSoldTableName}' WHERE id = ${eventRes.rows[0].id}`)

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
    await client.query('BEGIN')
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

async function updateTickets(id, tickets) {
  let newTickets
  let newTicketsValues
  let oldTickets
  let oldTicketsValues
  const newTickets = tickets.filter(ticket => {
    if (ticket.id) {
      oldTickets.push(ticket)
      oldTicketsValues.push(...Object.values(ticket))
    } else {
      newTickets.push(ticket)
    }
  })
  let success = false
  const client = await getClient()
  try {
    await client.query('BEGIN')

    let newTicketsQuery = `INSERT INTO ${TICKETS_TYPE_DB} (price, name, amount, eventid) values`
    let counter = 2;
    for (let i = 0; i < newTickets.length; i += 1) {
      newTicketsQuery += `($${counter}, $${counter + 1}, $${counter + 2}, $1)`
      if (i < newTickets.length - 1) {
        newTicketsQuery += ','
      }
      counter += 3
    }
   // await client.query(newTicketsQuery, [id])
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


const {
  EVENTS_DB
} = process.env

async function getEventsDb(){
  return await query(`SELECT * FROM ${EVENTS_DB}`);
}



module.exports = {
  getEventsDb,
  insertEventDb,
  getEventByIdDb,
  updateEventDb,
}