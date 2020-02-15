const {
  query,
  getClient
} = require('./db');
const formatter = require('../formatter')
const util = require('util');
const fs = require('fs');
const readFileAsync = util.promisify(fs.readFile);
const { DB_CONSTANTS } = require('../helpers')
const { SYSTEM_ERROR } = require('../Messages')

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
let message = {success:false}
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
  let speakers = event.speakers || [] //[{name:String, id: Integer (iff speaker exists in our db)}]
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
      console.log(eventQuery)
    const eventRes = await client.query(eventQuery, [...Object.values(myEvent), myOrganizationId])
    const eventR = await formatter.formatEventFromEventsTable(eventRes.rows[0])

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
    console.log(ticketQuery)
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

    console.log(connectSpeakersToEventQuery)
    if(theSpeakers.length > 0){await client.query(connectSpeakersToEventQuery)}
    


    //Connect the tags to this Event

    //Todo: remove functionality that user can insert whatever tag he wants. Must be in database
    let tagIds = []
    let tags = []
    if (event.tags && event.tags.length > 0) {
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
      startdate, enddate, minprice, maxprice, tagsids, speakersids, cecredits, categoryid, description, organization, country, 
      city, speakers, tags, image, shortdescription, startsellingtime, finishsellingtime) 
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, $15, $16, $17, $18, $19, $20, $21, $22, $23) returning *`
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
      country, cityResult.rows[0].name, speakersNames, tags, event.image, event.shortDescription,
    event.startSellingTime, event.finishSellingTime]

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
    message = {
      success: success,
      id: eventId
    }
  } catch (e) {
    await client.query('ROLLBACK')
    console.log("Insert event error:", e)
    message = SYSTEM_ERROR()
    message.errorMessage = e + "MAMMA"
  } finally {
    client.end()
  }
  return message
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
  let eventQuery = `select * from ${DB_CONSTANTS.EVENTS_INFO_VIEW} where eventid = ${id} and isvisible = true`
  let result = await query(eventQuery)
  if(!result.rows[0]){return null}
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

async function changeEventState(eventId, isSelling, isSoldOut, isVisible){
  let client = await getClient()
  let message = {}
  tryBlock: try {
    await client.query('BEGIN')
    let result = await client.query(`update ${DB_CONSTANTS.EVENTS_DB} set isselling = ${isSelling}, issoldout = ${isSoldOut}, isvisible = ${isVisible}
    where id = ${eventId} returning *`)
    if(!result.rows[0]){
      await client.query('ROLLBACK')
      message = {success:false, messages:[{message:"FAILURE ON FIRST", type:"error"}]}
      break tryBlock
    }

    result = await client.query(`update ${DB_CONSTANTS.SEARCH_EVENTS_DB} set isselling = ${isSelling}, issoldout = ${isSoldOut}, isvisible = ${isVisible}
    where eventid = ${eventId} returning *`)
    if(!result.rows[0]){
      await client.query('ROLLBACK')
      message = {success:false, messages:[{message:"FAILURE ON SECOND", type:"error"}]}
      break tryBlock
    }



    await client.query('COMMIT')
    message.success = true
    message.event = result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    console.log(error)
    message = {success:false, messages:[{message:"MAJOR FAILURE", type:"error"}]}
  } finally{
    await client.end()
    return message
  }
}


module.exports = {
  insertEventDb,
  getEventByIdDb,
  getInsertValuesDb,
  changeEventState
}