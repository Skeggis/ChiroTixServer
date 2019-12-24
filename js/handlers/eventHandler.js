const {
  getEventsDb,
  insertEventDb,
  updateEventDb,
  getEventByIdDb,
  updateTicketsTypeDb
} = require('../database/eventDb.js')

const {
  validateInsertEvent
} = require('../validation/eventValidation')

async function getEvents() {
  const result = await getEventsDb()
  return result.rows
}

async function insertEvent(event){

  //TODO: validate

  // const errors = validateInsertEvent(event)

  // if(errors.length > 0){
  //   return{
  //     success: false,
  //     messages: errors
  //   }
  // }

  event.startDate = new Date(event.startDate)
  event.endDate = new Date(event.endDate)
  event.startSellingTime = new Date(event.startSellingTime)
  event.finishSellingTime = new Date(event.finishSellingTime)
  const result = await insertEventDb(event)

  if(result.success){
    return {
      success: true,
      messages: [{message: 'Successfully inserted event'}]
    }
  }

  return {
    success: false,
    messages: [{message: 'Something went wrong inserting event'}]
  };
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