require('dotenv').config()
const searchDB = require('../../js/database/searchDB')
const eventHandler = require('../../js/handlers/eventHandler')
const expect = require('chai').expect;
const {query} = require('../../js/database/db')
const {DB_CONSTANTS} = require('../../js/helpers')

describe('searchDb test', async () => {
    let categoryId;
  let organizationId;
  let tagIds=[]
  let cityId;
  let countryId;
  let event = {
    name: 'testEvent',
    longDescription: 'longDescription',
    shortDescription: 'shortDescription',
    image: 'image',
    categoryId: categoryId,
    CECredits: 5,
    startDate: '2019-12-18',
    endDate: '2019-12-21',
    latitude: 0,
    longitude: 0,
    organizationId: organizationId,
    tagIds: tagIds,
    cityId: cityId,
    tickets: [
      {
        price: 100,
        amount: 1000,
        name: 'basic'
      },
      {
        name: 'premium',
        price: 200,
        amount: 500
      }
    ],
    speakers: [
      {
        name: 'Róbert'
      },
      {
        name: 'Þórður',
      },
      {
        name: 'Vignir'
      }
    ]
  }
  before(async () => {
    let result = await query(`select * from ${DB_CONSTANTS.EVENTS_DB}`)
    await query(`insert into ${DB_CONSTANTS.SPEAKERS_DB} (name) values ('testSpeaker')`)
    result = await query(`insert into ${DB_CONSTANTS.CATEGORIES_DB} (category) values ('Massi') returning *`)
    event.categoryId = result.rows[0].id
    result = await query(`insert into ${DB_CONSTANTS.ORGANIZATIONS_DB} (name) values('ICPA') returning *`)
    event.organizationId = result.rows[0].id

    result = await query(`insert into ${DB_CONSTANTS.COUNTRIES_DB} (country) values('Iceland') returning *`)
    countryId = result.rows[0].id
    result = await query(`insert into ${DB_CONSTANTS.CITIES_DB} (city, countryid) values('Reykjavik', ${countryId}) returning *`)
    event.cityId = result.rows[0].id


    result = await query(`insert into ${DB_CONSTANTS.TAGS_DB} (tag) values ('Massi') returning *`)
    tagIds.push(result.rows[0].id)
    result = await query(`insert into ${DB_CONSTANTS.TAGS_DB} (tag) values ('Hands on') returning *`)
    tagIds.push(result.rows[0].id)
    result = await query(`insert into ${DB_CONSTANTS.TAGS_DB} (tag) values ('Red') returning *`)
    tagIds.push(result.rows[0].id)
    event.tagIds = tagIds
  })

    it('create event and search for it', async () => {
        let result = await eventHandler.insertEvent(event)
        console.log(result)
        console.log(await searchDB.search({
            organizations:[event.organizationId,2,3], 
            countries:[1,2,countryId], 
            cities:[1,2,event.cityId],
            tags: event.tagIds,
            speakers: [1,2]
        }))
    })
})