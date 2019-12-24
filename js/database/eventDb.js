const {
  query,
  getClient
} = require('./db');
const formatter = require('../formatter')
const util = require('util');
const fs = require('fs');
const readFileAsync = util.promisify(fs.readFile);
const {DB_CONSTANTS} = require('../helpers')

async function getEventsDb() {
  return await query(`SELECT * FROM ${DB_CONSTANTS.EVENTS_DB}`);
}

/**
 * 
 * @param {Object} event : {
 *          ALLT í MYEVENT,
 *          tickets: [{price: Double, name:String, amount:Integer}],
 *          speakers: [{name:String, id: Integer (iff speaker is a new speaker)}],
 *          tags: [{id:Integer, tag:String}]
 * }
 */
async function insertEventDb(event) {

  const myEvent = {
    name: event.name,
    startdate: event.startDate,
    enddate: event.endDate,
    shortdescription: event.shortDescription,
    longdescription: event.longDescription,
    image: event.image,
    cityId: event.city.cityId,
    longitude: event.longitude,
    latitude: event.latitude,
    categoryid: event.category.categoryId,
    startsellingtime: event.startSellingTime,
    finishsellingtime: event.finishSellingTime,
    cecredits: event.CECredits,
    organizationid: event.organization.organizationId
  }
  let speakers = event.speakers //[{name:String, id: Integer (iff speaker exists in our db)}]

  let success = false
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const eventQuery = `INSERT INTO ${DB_CONSTANTS.EVENTS_DB} (name, startdate, enddate, shortdescription, longdescription, image, cityid, longitude, latitude, categoryid,
      startsellingtime, finishsellingtime, cecredits, organizationid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9, $10, $11, $12, $13, $14) RETURNING *`
    const eventRes = await client.query(eventQuery, Object.values(myEvent))
    const eventR = await formatter.formatEvent(eventRes.rows[0])

    const ticketValues = []
    event.tickets.forEach(ticket => {
      ticketValues.push(ticket.price, ticket.name, ticket.amount)
    })
    let ticketQuery = `insert into ${DB_CONSTANTS.TICKETS_TYPE_DB} (price, name, amount, eventid) values`
    let counter = 1;
    for (let j = 0; j < event.tickets.length; j++) {
      ticketQuery += ` ($${counter}, $${counter + 1}, $${counter + 2}, ${eventR.id})`
      if (j < event.tickets.length - 1) {
        ticketQuery += ","
      }
      counter += 3
    }
    ticketQuery += ' RETURNING *'

    await client.query(ticketQuery, ticketValues)

    const soldTicketsTable = await readFileAsync('./sql/ticketsSold.sql')
    const ticketsSoldTableName = `ticketssold_${eventR.id}`
    await client.query(`CREATE TABLE ${ticketsSoldTableName} ${soldTicketsTable.toString('utf8')}`)

    await client.query(`UPDATE ${DB_CONSTANTS.EVENTS_DB} SET ticketstablename = '${ticketsSoldTableName}' WHERE id = ${eventR.id}`)//TODO: Move into the original insert?

    //need to check if speaker already exists before we create new
    //and need to check if old speaker is already connected to event
    let newSpeakers = []
    let insertNewSpeakersQuery = `insert into ${DB_CONSTANTS.SPEAKERS_DB} (name) values`
    let oldSpeakers = []
    let speakerErrors=[]
    for(let i = 0; i < speakers.length; i++){
      let speaker = speakers[i]
      if (speaker.id) { oldSpeakers.push(speaker) }
      else {
        const check = await client.query(`select * from ${DB_CONSTANTS.SPEAKERS_DB} where name = $1`, [speaker.name])
        if(check.rowCount > 0){
          speakerErrors.push({
            message: 'A speaker with this name already exists'
          })
        } else {
          newSpeakers.push(speaker)
          if (newSpeakers.length != 1) { insertNewSpeakersQuery += "," }
          insertNewSpeakersQuery += ` ('${speaker.name}')`
        }
      }
    }
    insertNewSpeakersQuery += ' returning *'

    if(speakerErrors.length > 0) {
      return {
        success: false,
        messages: speakerErrors
      }
    }

    let theSpeakers = []
    if (newSpeakers.length != 0) {
      let newSpeakersResult = await client.query(insertNewSpeakersQuery)
      theSpeakers = await formatter.formatSpeakers(newSpeakersResult.rows)
    }

    theSpeakers = oldSpeakers.concat(theSpeakers)

    let connectSpeakersToEventQuery = `insert into ${DB_CONSTANTS.SPEAKERS_CONNECT_DB} (eventid, speakerid) values`

    let speakersIds = []
    let speakersNames = []
    for(let i = 0; i < theSpeakers.length; i++){
      let speaker = theSpeakers[i]
      connectSpeakersToEventQuery += ` (${eventR.id}, ${speaker.id})`
      if (i < theSpeakers.length - 1) {
        connectSpeakersToEventQuery += ','
      }
      speakersIds.push(speaker.id)
      speakersNames.push(speaker.name)
    }
    console.log(connectSpeakersToEventQuery)

    await client.query(connectSpeakersToEventQuery)

    //Connect the tags to this Event
    let tagIds = []
    let tags = []
    if(event.tags.length > 0){
      let tagsConnectQuery = `insert into ${DB_CONSTANTS.TAGS_CONNECT_DB} (eventid, tagid) values `
      for(let i = 0; i < event.tags.length; i++){
        if(i != 0){tagsConnectQuery += ","}
        tagsConnectQuery += `(${eventR.id},${event.tags[i].id})`
        tagIds.push(event.tags[i].id)
        tags.push(event.tags[i].tag)
      }
      await client.query(tagsConnectQuery)
    }
    
    let insertSearchQuery = `insert into ${DB_CONSTANTS.SEARCH_EVENTS_DB} (eventid, name, organizationid, countryid, cityid,
      startdate, enddate, minprice, maxprice, tagsids, speakersids, cecredits, categoryid, description, organization, country, city, speakers, tags) 
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, $15, $16, $17, $18, $19) returning *`
    let minPrice = Infinity
    let maxPrice = 0
    for(let i = 0; i < event.tickets.length; i++){
      if(minPrice > event.tickets[i].price){minPrice = event.tickets[i].price}
      if(maxPrice < event.tickets[i].price){maxPrice = event.tickets[i].price}
    }
    let cityResult = await client.query(`select * from ${DB_CONSTANTS.CITIES_DB}`)
    let countryId = cityResult.rows[0].countryid
    let countryResult = await client.query(`select * from ${DB_CONSTANTS.COUNTRIES_DB}`)
    let country = countryResult.rows[0].country
    const searchEventValues = [eventR.id, event.name, event.organization.organizationId, countryId, event.city.cityId, 
      event.startDate, event.endDate, minPrice, maxPrice, tagIds || [], speakersIds, event.CECredits, 
      event.category.categoryId, event.longDescription + " " + event.shortDescription, event.organization.organization,
      country, event.city.city, speakersNames, tags]

    let searchTableResult = await client.query(insertSearchQuery, searchEventValues)

    let updateQueryForTextSearch = `update ${DB_CONSTANTS.SEARCH_EVENTS_DB} set textsearchable_index_col = 
      ( setweight(to_tsvector('english', name), 'A')  ||  
                           setweight(to_tsvector('english', description), 'C') ||
                           setweight(to_tsvector('english', organization), 'B') ||
                           setweight(to_tsvector('english', country), 'B') ||
                           setweight(to_tsvector('english', array_to_string(speakers, ' ')), 'B') ||
                           setweight(to_tsvector('english', city), 'B') ||
                           setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B')
                           ) where id = ${searchTableResult.rows[0].id}`
    await client.query(updateQueryForTextSearch)

    await client.query('COMMIT')
    success = true
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.end()
  }
  return {
    success: success
  }
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
    let q = `UPDATE ${DB_CONSTANTS.EVENTS_DB} set ${t} WHERE id = $${counter += 1}`
    await client.query(q, [...Object.values(event), id])


    //Update the searchTable!!!! TODO


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
      let newTicketsQuery = `INSERT INTO ${DB_CONSTANTS.TICKETS_TYPE_DB} (name, price, amount, eventid) values`
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
      const currentSellingTime = await client.query(`SELECT startsellingtime FROM ${DB_CONSTANTS.EVENTS_DB} WHERE id = $1`, [id])
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
            const check = await client.query(`SELECT * FROM ${DB_CONSTANTS.TICKETS_TYPE_DB} WHERE id = $1`, [ticket.id])
            if (check.rowCount === 0) {
              ticketErrors.push({
                message: 'This ticket does not exist',
                ticketId: ticket.id
              })
            } else {
              //Lets check the min number of tickets the user can change to
              const ticketsTableName = await client.query(`SELECT ticketstablename FROM ${DB_CONSTANTS.EVENTS_DB} WHERE id = $1`, [id])
              const soldOrReserved = await client.query(`SELECT * FROM ${ticketsTableName.rows[0].ticketstablename}`) //ticket is inserted into table if it is reserved

              if (ticket.amount >= soldOrReserved.rowCount) {
                const amountQuery = `UPDATE ${DB_CONSTANTS.TICKETS_TYPE_DB} SET amount = $1 WHERE id = $2`
                await client.query(amountQuery, [ticket.amount, ticket.id])
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
          const check = await client.query(`SELECT * FROM ${DB_CONSTANTS.TICKETS_TYPE_DB} WHERE id = $1`, [ticket.id])
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
            const q = `UPDATE ${DB_CONSTANTS.TICKETS_TYPE_DB} SET ${t} where id = $1`
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

async function updateSpeakersForEvent(eventId, speaker) {
  let newSpeakers = []
  let oldSpeakers = []//Spaekers that already exists in the database. We are not going to change the speaker
  speakers.filter(speaker => {
    if (speaker.id) {
      oldSpeakers.push(speaker)
    } else {
      newSpeakers.push(speaker)
    }
  })

  let success = false
  const client = await getClient()
  try {
    await client.query('BEGIN')

    let speakerErrors = []
    newSpeakers.forEach(async speaker => {
      //check if name exists already
      const check = await client.query(`select 1 from ${DB_CONSTANTS.SPEAKERS_DB} WHERE name = $1`, [speaker.name])
      if (check.rowCount === 0) {
        await client.query(`insert into ${DB_CONSTANTS.SPEAKERS_DB} (name) values ($1) returning *`, [speaker.name])
        await client.query(`insert into ${DB_CONSTANTS.SPEAKERS_CONNECT_DB} (eventid, speakerid) values ($1, $2)`, [eventId, speaker.id])
      } else {
        speakerErrors.push({
          message: `Speaker with name ${speaker.name} already exists`
        })
      }
    })

    oldSpeakers.forEach(async speaker => {
      const check = await client.query(`select * from ${DB_CONSTANTS.SPEAKERS_DB} where id = $1`, [speaker.id])
      if (check.rowCount === 0) {
        speakerErrors.push({
          message: 'Speaker does not exist'
        })
      } else {
        //chekcif speaker is already assigned to event
        const check = await client.query(`select * from ${DB_CONSTANTS.SPEAKERS_CONNECT_DB} where eventid = $1 AND speakerid = $2`, [eventId, speaker.id])
        if (check.rowCount > 0) {
          speakerErrors.push({
            message: 'This speaker is already assigned to this event'
          })
        } else {
          await client.query(`insert into ${DB_CONSTANTS.SPEAKERS_CONNECT_DB} (eventid, speakerid) values ($1, $2)`, [event.id, speaker.id])
        }
      }
    })

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


async function getEventsDb() {
  return await query(`SELECT * FROM ${DB_CONSTANTS.EVENTS_DB}`);
}

async function getEventByIdDb(id){
  let eventQuery = `select * from ${DB_CONSTANTS.EVENTS_INFO_VIEW} where eventid = ${id}`
  let result = await query(eventQuery)
  let {eventInfo} = await formatter.formatEventInfoView(result.rows)
  let tagsQuery = `select * from ${DB_CONSTANTS.TAGS_CONNECT_DB} inner join ${TAGS_DB} on 
  ${DB_CONSTANTS.TAGS_CONNECT_DB}.tagid = ${TAGS_DB}.id where eventid = ${id}`
  let tagsResult = await query(tagsQuery)
  eventInfo.tags = tagsResult.rows
  let speakersQuery = `select * from ${DB_CONSTANTS.SPEAKERS_CONNECT_DB} inner join ${DB_CONSTANTS.SPEAKERS_DB} on 
  ${DB_CONSTANTS.SPEAKERS_CONNECT_DB}.speakerid = ${DB_CONSTANTS.SPEAKERS_DB}.id where eventid = ${id};`
  let speakersResult = await query(speakersQuery)
  eventInfo.speakers = speakersResult.rows

  return {eventInfo}
}



module.exports = {
  getEventsDb,
  insertEventDb,
  getEventByIdDb,
  updateEventDb,
  updateTicketsTypeDb
}