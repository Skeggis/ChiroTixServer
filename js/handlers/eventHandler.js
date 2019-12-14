const {
  getEventsDb,
  insertEventDb,
  updateEventDb,
  getEventByIdDb
} = require('../database/eventDb.js')

async function getEvents() {
  const result = await getEventsDb()
  return result.rows
}

async function insertEvent(event){

  event.date = new Date(event.date)
  const result = await insertEventDb(event)
  return result;
}

async function updateEvent(id, event, tickets){
  if(event.date){
    event.date = new Date(event.date)
  }
  
  if(event.startSellingTime){
    event.startSellingTime = new Date(event.startSellingTime)
  }

  const result = await updateEventDb(id, event)
  return result
}

async function getEventById(id){
  const result = await getEventByIdDb(id)
  return result.rows[0]
}

module.exports = {
  getEvents,
  insertEvent,
  updateEvent,
  getEventById
}