const {silence,verbose} = require('../helpers')
const expect = require('chai').expect;
const {insertEventDb} = require('../../js/database/eventDb')
const db = require('../../js/database/db')
const {
    NORMAL_EVENT,
    NEW_SPEAKERS,
    NEW_ORGANIZATIONS,
    TICKET_TYPES,
    TAGS_IDS,
    NORMAL_BUYER_INFO,
    RECEIPT
} = require('../testData')
const faker = require('faker')
const eventDb = require('../../js/database/eventDb')
const formatter = require('../../js/formatter')
const {
    DB_CONSTANTS
} = require('../../js/helpers')

const {
} = DB_CONSTANTS;

describe('#eventDb.js: ', async function(){

  context('.getInsertValuesDb', async function(){it('shouldTest.getInsertValuesDb', async function(){

    let result = await eventDb.getInsertValuesDb()
    console.log(result)
  })})
  context('.insertEventDb: ', async function(){it('shouldTest.insertEventDb', async function(){})})
  context('.getEventByIdDb', async function(){it('shouldTest.getEventByIdDb', async function(){})})

})