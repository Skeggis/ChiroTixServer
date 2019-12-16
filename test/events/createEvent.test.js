require('dotenv').config()
const expect = require('chai').expect;
const eventHandler = require('../../js/handlers/eventHandler')
const { query } = require('../../js/database/db')
const {
  TICKETS_TYPE_DB,
  SPEAKERS_DB,
  SPEAKERS_CONNECT_DB,
  EVENTS_DB
} = process.env

describe('Create events', async () => {
  before(async () => {
    const result = await query(`select * from ${EVENTS_DB}`)
    console.log(result)
    result.rows.forEach(async row => await query(`drop table if exists ${row.tickettablename}`))
    await query(`delete from ${TICKETS_TYPE_DB}`)
    await query(`delete from ${SPEAKERS_CONNECT_DB}`)
    await query(`delete from ${SPEAKERS_DB}`)
    await query(`delete from ${EVENTS_DB}`)
    await query(`insert into ${SPEAKERS_DB} (name) values ('testSpeaker')`)
  })

  describe('Successful creation', async () => {

    it('should create an event successfully that starts selling tickets right away', async () => {
      let event = {
        name: 'testEvent',
        longDescription: 'longDescription',
        shortDescription: 'shortDescription',
        image: 'image',
        date: '12-13-19',
        locationId: global.location.id,
        latitude: 0,
        longitude: 0,
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

  describe('Unsuccessful creation', async () => {
    it('should fail to insert a event because of missing parameters', async () => {
      event = {
        name: 'only name passed'
      }

      const result = await eventHandler.insertEvent(event)
      expect(result.success).to.be.false

      const eventResult = await query(`select * from ${EVENTS_DB}`)
      expect(eventResult.rowCount).to.be.equal(1)
    })

    // it('should fail to insert event because there already exists a speaker with given name', async () => {
    //   event = {
    //     name: 'testEvent',
    //     longDescription: 'longDescription',
    //     shortDescription: 'shortDescription',
    //     image: 'image',
    //     date: '12-13-19',
    //     locationId: global.location.id,
    //     latitude: 0,
    //     longitude: 0,
    //     tickets: [
    //       {
    //         price: 100,
    //         amount: 1000,
    //         name: 'basic'
    //       },
    //       {
    //         name: 'premium',
    //         price: 200,
    //         amount: 500
    //       }
    //     ],
    //     speakers: [
    //       {
    //         name: 'Róbert'
    //       },
    //       {
    //         name: 'testSpeaker',
    //       },
    //       {
    //         name: 'Vignir'
    //       }
    //     ]
    //   }

    //   const result = await eventHandler.insertEvent(event)
    //   expect(result.success).to.be.false

    //   const eventQuery = await query(`select * from ${EVENTS_DB}`)
    //   expect(eventQuery.rowCount).to.be.equals(0)

    //   const speakerQuery = await query(`select * from ${SPEAKERS_DB}`)
    //   expect(speakerQuery.rowCount).to.be.equals(1)
    // })
  })
})
