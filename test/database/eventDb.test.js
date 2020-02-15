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
const eventDb = require('../../js/database/eventDb')
const formatter = require('../../js/formatter')
const {
    DB_CONSTANTS
} = require('../../js/helpers')

const {
} = DB_CONSTANTS;

describe('#eventDb.js: ', async function(){

  context('.getEventsDb: ', async function(){})
  context('.getEventByIdDb', async function(){})
  context('.updateTicketsTypeDb', async function(){})
  context('.getInsertValuesDb', async function(){})
  context('.insertEventDb: ', async function(){})

})