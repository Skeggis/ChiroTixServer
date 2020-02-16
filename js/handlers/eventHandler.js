const { BAD_REQUEST } = require('../Messages')

const {
  insertEventDb,
  getEventByIdDb
} = require('../database/eventDb.js')

const {
  validateInsertEvent
} = require('../validation/eventValidation')

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

async function getEventById(id){
  const result = await getEventByIdDb(id)
  if(!result){return BAD_REQUEST("Could not find event")}
  return {eventInfo:result.eventInfo, success:true}
}

module.exports = {
  insertEvent,
  getEventById
}