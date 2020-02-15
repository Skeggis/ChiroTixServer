const {
  query,
  getClient
} = require('./db');
const formatter = require('../formatter')
const util = require('util');
const fs = require('fs');
const readFileAsync = util.promisify(fs.readFile);
const { DB_CONSTANTS } = require('../helpers')

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
    cityid: event.cityId,
    longitude: event.longitude,
    latitude: event.latitude,
    categoryid: event.category,
    startsellingtime: event.startSellingTime,
    finishsellingtime: event.finishSellingTime,
    cecredits: event.CECredits,
    schedule: event.schedule
  }
  let organization = event.organization // [{name: String, id: Integer (if organization exists in db)}]
  let speakers = event.speakers //[{name:String, id: Integer (iff speaker exists in our db)}]
  let success = false
  let eventId;
  const client = await getClient()
  try {
    await client.query('BEGIN')

    //create organization if organization does not have id. Else just insert id
    let myOrganizationId
    let myOrganization
    if(organization.id){
      //Caution: user can insert a name that is a number i.e. potentially a id does not exist. Then we insert a new organization with the id as a name
      myOrganizationId = organization.id
      myOrganization = await client.query(`select * from ${ORGANIZATIONS_DB} where id = $1`, [organization.id])
      if(myOrganization.rows.length === 0){
        myOrganization = await client.query(`insert into ${DB_CONSTANTS.ORGANIZATIONS_DB} (name) values ($1) returning *`, [myOrganizationId])
      }
      myOrganization = myOrganization.rows[0]
    } else {
      //We need to check if the name already exists in the db
      const check = await client.query(`select * from ${DB_CONSTANTS.ORGANIZATIONS_DB} where name = $1`, [organization.name])
      if(check.rows.length > 0){
        myOrganization = check.rows[0]
        myOrganizationId = check.rows[0].id
      } else {
        myOrganization = await client.query(`insert into ${DB_CONSTANTS.ORGANIZATIONS_DB} (name) values ($1) returning *`, [organization.name])
        myOrganizationId = myOrganization.rows[0].id
        myOrganization = myOrganization.rows[0]

      }
    }

    const eventQuery = `INSERT INTO ${DB_CONSTANTS.EVENTS_DB} (name, startdate, enddate, shortdescription, longdescription, image, cityid, longitude, latitude, categoryid,
      startsellingtime, finishsellingtime, cecredits, schedule, organizationid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9, $10, $11, $12, $13, $14, $15) RETURNING *`
    const eventRes = await client.query(eventQuery, [...Object.values(myEvent), myOrganizationId])
    const eventR = await formatter.formatEvent(eventRes.rows[0])

    const ticketValues = []
    for(let i = 0; i < event.tickets.length; i++){
      let ticket = event.tickets[i]
      ticketValues.push(ticket.price, ticket.name, ticket.amount, ticket.ownerInfo)
    }
    let ticketQuery = `insert into ${DB_CONSTANTS.TICKETS_TYPE_DB} (price, name, amount, eventid, ownerinfo) values`
    let counter = 1;
    for (let j = 0; j < event.tickets.length; j++) {
      ticketQuery += ` ($${counter}, $${counter + 1}, $${counter + 2}, ${eventR.id}, $${counter + 3})`
      if (j < event.tickets.length - 1) {
        ticketQuery += ","
      }
      counter += 4
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
    let insertNewSpeakersQuery = `insert into ${DB_CONSTANTS.SPEAKERS_DB} (name, image) values`
    let oldSpeakers = []
    let speakerErrors = []
  
    for (let i = 0; i < speakers.length; i++) {
      let speaker = speakers[i]
      if (speaker.id) {
        //Get the name of the old speaker
        const oldSpeaker = await client.query(`select name from ${DB_CONSTANTS.SPEAKERS_DB} where id = $1`, [speaker.id])
         oldSpeakers.push({name: oldSpeaker.rows[0].name, id: speaker.id})
        }
      else {
        const check = await client.query(`select * from ${DB_CONSTANTS.SPEAKERS_DB} where name = $1`, [speaker.name])
        //if speaker already exist just juse that speaker
        if (check.rowCount > 0) {
          oldSpeakers.push({name: check.rows[0].name, id: check.rows[0].id})
        } else {
          newSpeakers.push(speaker)
          if (newSpeakers.length != 1) { insertNewSpeakersQuery += "," }
          insertNewSpeakersQuery += ` ('${speaker.name}', '${speaker.image}')`
        }
      }
    }
    insertNewSpeakersQuery += ' returning *'

    if (speakerErrors.length > 0) {
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
    for (let i = 0; i < theSpeakers.length; i++) {
      let speaker = theSpeakers[i]
      connectSpeakersToEventQuery += ` (${eventR.id}, ${speaker.id})`
      if (i < theSpeakers.length - 1) {
        connectSpeakersToEventQuery += ','
      }
      speakersIds.push(speaker.id)
      speakersNames.push(speaker.name)
    }


    await client.query(connectSpeakersToEventQuery)


    //Connect the tags to this Event

    //Todo: remove functionality that user can insert whatever tag he wants. Must be in database
    let tagIds = []
    let tags = []
    if (event.tags.length > 0) {
      let tagsConnectQuery = `insert into ${DB_CONSTANTS.TAGS_CONNECT_DB} (eventid, tagid) values `
      for (let i = 0; i < event.tags.length; i++) {
        if (i != 0) { tagsConnectQuery += "," }
        tagsConnectQuery += `(${eventR.id},${event.tags[i]})`
        tagIds.push(event.tags[i])
        const myTag = await client.query(`select name from ${DB_CONSTANTS.TAGS_DB} where id = $1`, [event.tags[i]])
        tags.push(myTag.rows[0].name)
      }
      await client.query(tagsConnectQuery)
    }

    let insertSearchQuery = `insert into ${DB_CONSTANTS.SEARCH_EVENTS_DB} (eventid, name, organizationid, countryid, cityid,
      startdate, enddate, minprice, maxprice, tagsids, speakersids, cecredits, categoryid, description, organization, country, city, speakers, tags, image, shortdescription) 
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, $15, $16, $17, $18, $19, $20, $21) returning *`
    let minPrice = Infinity
    let maxPrice = 0
    for (let i = 0; i < event.tickets.length; i++) {
      if (minPrice > event.tickets[i].price) { minPrice = event.tickets[i].price }
      if (maxPrice < event.tickets[i].price) { maxPrice = event.tickets[i].price }
    }
    let cityResult = await client.query(`select * from ${DB_CONSTANTS.CITIES_DB} where id = $1`, [event.cityId])
    let countryId = cityResult.rows[0].countryid
    let countryResult = await client.query(`select * from ${DB_CONSTANTS.COUNTRIES_DB} where id = $1`, [countryId])
    let country = countryResult.rows[0].name
    const searchEventValues = [eventR.id, event.name, myOrganizationId, countryId, event.cityId,
    event.startDate, event.endDate, minPrice, maxPrice, tagIds || [], speakersIds, event.CECredits,
    event.category, event.longDescription + " " + event.shortDescription, myOrganization.name,
      country, cityResult.rows[0].name, speakersNames, tags, event.image, event.shortDescription]

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
    eventId = eventR.id
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.end()
  }
  return {
    success: success,
    id: eventId
  }
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

async function getInsertValuesDb() {
  let result ={
    success: false,
    data: {}
  }
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const countries = await client.query(`select * from ${DB_CONSTANTS.COUNTRIES_DB}`)
    result.data.countries = countries.rows

    const cities = await client.query(`select * from ${DB_CONSTANTS.CITIES_DB}`)
    result.data.cities = cities.rows

    const tags = await client.query(`select * from ${DB_CONSTANTS.TAGS_DB}`)
    result.data.tags = tags.rows

    const organizations = await client.query(`select * from ${DB_CONSTANTS.ORGANIZATIONS_DB}`)
    result.data.organizations = organizations.rows

    const categories = await client.query(`select * from ${DB_CONSTANTS.CATEGORIES_DB}`)
    result.data.categories = categories.rows

    const speakers = await client.query(`select * from ${DB_CONSTANTS.SPEAKERS_DB}`)
    result.data.speakers = speakers.rows


    await client.query('COMMIT')
    result.success = true
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.end()
  }
  return result
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
  // updateEventDb,
  updateTicketsTypeDb,
  getInsertValuesDb
}