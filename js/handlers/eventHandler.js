const {
  getEventsDb,
  insertEventDb,
  updateEventDb,
  getEventByIdDb,
  updateTicketsTypeDb
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
  if(!result){
    return {
      success: false,
      message: 'Something went wrong updating event'
    }
  }

  const ticketResult = await updateTicketsTypeDb(id, tickets)
  if(!ticketResult){
    return {
      success: false,
      message: 'Something went wrong updating event'
    }
  }

  return {
    success: true,
    message: 'Successfully updated event'
  }
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