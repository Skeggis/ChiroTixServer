const moment = require('moment')

async function validateInsertEvent(event) {
  const errors = []

  if (typeof event.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Name must be a string'
    })
  }

  if (typeof event.date !== 'string' || moment(event.date).isValid){
    errors.push({
      field: 'date',
      message: 'Date must be valid'
    })
  }

  if(typeof shortdescription !== 'string'){
    errors.push({
      field: 'shortDescription',
      message: 'ShortDescription must be a string'
    });
  }

  if(typeof longDescription !== 'string'){
    errors.push({
      field: 'LongDescription',
      message: 'LongDescription must be a string'
    })
  }

}