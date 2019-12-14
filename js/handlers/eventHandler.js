const {
  getEventsDb,
  insertEventDb
} = require('../database/eventDb.js')

async function getEvents() {
  const result = await getEventsDb()
  return result.rows
}

async function insertEvent(event){
  const result = await insertEventDb(event)
  return result.rows[0];
}

module.exports = {
  getEvents,
  insertEvent
}