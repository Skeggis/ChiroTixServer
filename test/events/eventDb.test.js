require('dotenv').config()
const expect = require('chai').expect;
const eventHandler = require('../../js/handlers/eventHandler')
const { query } = require('../../js/database/db')
const {
  TICKETS_TYPE_DB,
  SPEAKERS_DB,
  SPEAKERS_CONNECT_DB,
  CATEGORIES_DB,
  EVENTS_DB,
  ORGANIZATIONS_DB,
  TAGS_DB,
  TAGS_CONNECT_DB,
  CITIES_DB,
  COUNTRIES_DB
} = process.env

describe('Create events', async () => {
  let categoryId;
  let organizationId;
  let tags=[]
  let cityId;
  let event = {
    name: 'testEvent',
    longDescription: 'longDescription bro this is very cool event for you icpa will be there and me too. Babies and good vibes.',
    shortDescription: 'shortDescription coolest event out there.',
    image: 'image',
    category: {categoryId: categoryId, category:''},
    CECredits: 5,
    startDate: '2019-12-18',
    endDate: '2019-12-21',
    latitude: 0,
    longitude: 0,
    organization: {organizationId: organizationId, organization:''},
    tags: tags,
    city: {cityId:cityId, city:''},
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
        name: 'Róbert Ingi Huldarsson'
      },
      {
        name: 'Þórður Ágústsson',
      },
      {
        name: 'Vignir'
      }
    ]
  }
  before(async () => {
    let result = await query(`select * from ${EVENTS_DB}`)
    await query(`insert into ${SPEAKERS_DB} (name) values ('testSpeaker')`)
    result = await query(`insert into ${CATEGORIES_DB} (category) values ('Massi') returning *`)
    event.category.categoryId = result.rows[0].id
    event.category.category = result.rows[0].category
    result = await query(`insert into ${ORGANIZATIONS_DB} (name) values('ICPA') returning *`)
    event.organization.organizationId = result.rows[0].id
    event.organization.organization = result.rows[0].name

    result = await query(`insert into ${COUNTRIES_DB} (country) values('Iceland') returning *`)
    let countryId = result.rows[0].id
    result = await query(`insert into ${CITIES_DB} (city, countryid) values('Reykjavik', ${countryId}) returning *`)
    event.city.cityId = result.rows[0].id
    event.city.city = result.rows[0].city


    result = await query(`insert into ${TAGS_DB} (tag) values ('Massi') returning *`)
    tags.push(result.rows[0])
    result = await query(`insert into ${TAGS_DB} (tag) values ('Hands on') returning *`)
    tags.push(result.rows[0])
    result = await query(`insert into ${TAGS_DB} (tag) values ('Red') returning *`)
    tags.push(result.rows[0])
    event.tags = tags
  })

  describe('Successful creation', async () => {
    it('should create an event successfully that starts selling tickets right away', async () => {
      
console.log(event)
      const result = await eventHandler.insertEvent(event)
console.log(result)
      expect(result.success).to.be.true

      const eventResult = await query(`select * from ${EVENTS_DB}`)
      expect(eventResult.rowCount).to.be.equal(1)

      const ticketsResult = await query(`select * from ${TICKETS_TYPE_DB}`)
      expect(ticketsResult.rowCount, 'Number of tickets should be 2').to.equal(2)

      const speakersResult = await query(`select * from ${SPEAKERS_DB}`)
      expect(speakersResult.rowCount).to.equals(4)
    })
  })

  describe.skip('Unsuccessful creation', async () => {
    it('should fail to insert a event because of missing parameters', async () => {
      event = {
        name: 'only name passed'
      }

      const result = await eventHandler.insertEvent(event)
      expect(result.success).to.be.false

      const eventResult = await query(`select * from ${EVENTS_DB}`)
      expect(eventResult.rowCount).to.be.equal(1)
    })


  })
})
