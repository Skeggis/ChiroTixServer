const { silence, verbose, silenceBefore } = require('../helpers')
const expect = require('chai').expect;
const db = require('../../js/database/db')
const faker = require('faker')
const eventDb = require('../../js/database/eventDb')
const formatter = require('../../js/formatter')
const testData = require('../testData')
const {
  DB_CONSTANTS
} = require('../../js/helpers')

const {
  EVENTS_DB,
  ORGANIZATIONS_DB,
  TICKETS_TYPE_DB,
  SPEAKERS_DB,
  SPEAKERS_CONNECT_DB,
  SEARCH_EVENTS_DB
} = DB_CONSTANTS;

describe('#eventDb.js: ', async function () {
  silence()
  context('.getInsertValuesDb', async function () {
    it('should get insert values data for search with correct structure', async function () {
      let result = await eventDb.getInsertValuesDb()
      expect(result).to.have.keys(['success', 'data'])
      expect(result).to.have.property('data')
        .which.is.an('object').which.has.keys(['countries', 'cities', 'tags', 'organizations', 'categories', 'speakers',])
    })
  })

  context('.insertEventDb', async function () {

    context('test when the component fails and succeeds', async function () {
      async function failPath(event) {
        let result = await eventDb.insertEventDb(event)

        expect(result.success).to.be.false
        expect(result).to.have.keys(['success', 'messages', 'errorMessage'])
        expect(result.messages).to.have.lengthOf(1)
      }

      async function successPath(event) {
        let result = await eventDb.insertEventDb(event)
        expect(result, `THE RESULT: ${JSON.stringify(result)} and events inserted: ${JSON.stringify(event)}`).to.have.keys(['success', 'id'])
        expect(result.success).to.be.true
      }

      context('insert 10 random events', async function () {
        for (let i = 0; i < 10; i++) {
          it('should succeed to insert a random normal event', async function () { await successPath(await testData.generateNewEvent()) })
        }
      })

      context('should not fail to insert an event when', async function () {
        it('speakers array is empty', async function () {
          let event = await testData.generateNewEvent()
          event.speakers = []
          await successPath(event)
        })
        it('speakers is undefined', async function () {
          let event = await testData.generateNewEvent()
          delete event.speakers
          await successPath(event)
        })
        it('tags array is empty', async function () {
          let event = await testData.generateNewEvent()
          event.tags = []
          await successPath(event)
        })
        it('tags is undefined', async function () {
          let event = await testData.generateNewEvent()
          delete event.tags
          await successPath(event)
        })
      })

      context('should fail to insert an event when', async function () {
        it('tickets is undefined', async function () {
          let event = await testData.generateNewEvent()
          delete event.tickets
          await failPath(event)
        })
        it('tickets array is empty', async function () {
          let event = await testData.generateNewEvent()
          event.tickets = []
          await failPath(event)
        })
      })
    })

    context('Test wether the data was inserted into the Db correctly on a successful insertEvent', async function(){
      let event;
      let eventId;
      let ticketsTableName;
      let organizationId;
      let speakersIds = [];

      this.beforeAll(async function(){
        silenceBefore()
        event = await testData.generateNewEvent()
        let result = await eventDb.insertEventDb(event)
        // expect(result.success).to.be.true
        eventId = result.id
      })

      it(`should create a new organization in ${ORGANIZATIONS_DB} db with the specified name`, async function(){
        let result = await db.query(`select * from ${ORGANIZATIONS_DB} where name='${event.organization.name}'`)

        expect(result.rows).to.have.lengthOf(1)

        organizationId = result.rows[0].id
      })

      it(`should insert data correctly into ${EVENTS_DB} db`, async function(){
        let expectedEventInfo = {
          id: eventId,
          name: event.name,
          schedule: event.schedule,
          startdate: event.startDate,
          enddate: event.endDate,
          shortdescription: event.shortDescription,
          longdescription: event.longDescription,
          image: event.image,
          cityid: event.cityId,
          categoryid: event.category,
          organizationid: organizationId,
          latitude: event.latitude,
          longitude: event.longitude,
          startsellingtime: event.startSellingTime,
          finishsellingtime: event.finishSellingTime,
          cecredits: event.CECredits,
          isselling: true,
          issoldout: false,
          isvisible: true
        }

        let result = await db.query(`select * from ${EVENTS_DB} where id = ${eventId}`)
    
        expect(result.rows).to.have.lengthOf(1)

        ticketsTableName = result.rows[0].ticketstablename
        delete result.rows[0].ticketstablename //Delete rows because one cannot know beforehand what the tablename is!
        delete result.rows[0].insertdate //Delete rows because one cannot know beforehand what the insertDate was!

        expect(result.rows[0]).to.eql(expectedEventInfo)
      })

      it.skip(`should insert ticket data correctly into ${TICKETS_TYPE_DB} db`, async function(){
        let result = await db.query(`select * from ${TICKETS_TYPE_DB} where eventid = ${eventId}`)
      })

      it('should create ticketsSoldTable for the event', async function (){
        let result = await db.query(`select * from ${ticketsTableName}`)
        expect(result).to.be.an('object')
      })

      it(`should insert new speakers into ${SPEAKERS_DB} db`, async function(){
        let speakersNames = []
        for(let i = 0; i < event.speakers.length; i++){ speakersNames.push(event.speakers[i].name) }

        let result = await db.query(`select * from ${SPEAKERS_DB} where name = Any('{${speakersNames}}')`)

        expect(result.rows).to.have.lengthOf(speakersNames.length)

        for(let i = 0; i < result.rows.length; i++){speakersIds.push(result.rows[i].id)}
      })

      it(`should connect each speaker to the event in the ${SPEAKERS_CONNECT_DB} db`, async function(){
        let result = await db.query(`select * from ${SPEAKERS_CONNECT_DB} where speakerid = Any('{${speakersIds}}') and eventid=${eventId}`)
        expect(result.rows).to.have.lengthOf(speakersIds.length)

        result = await db.query(`select * from ${SPEAKERS_CONNECT_DB} where eventid=${eventId}`)
        expect(result.rows).to.have.lengthOf(speakersIds.length)
      })

      it(`should insert (and update the index correctly) correct information into ${SEARCH_EVENTS_DB} db`)
    })

  })




  context('.getEventByIdDb', async function () { it('shouldTest.getEventByIdDb') })

})