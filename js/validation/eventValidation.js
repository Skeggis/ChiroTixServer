const {
  isValidDate
} = require('../helpers')

function validateInsertEvent(event) {
  const errors = []

  if (typeof event.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Name must be a string'
    })
  }

  if (typeof event.date !== 'string' || !isValidDate(new Date(event.date))) {
    errors.push({
      field: 'date',
      message: 'Date must be valid'
    })
  }

  if(event.startSellingTime && (typeof event.startSellingTime === 'string' || !isValidDate(new Date(event.startSellingTime)))){
    errors.push({
      field: 'startSellingTime',
      message: 'StartSellingTime must be a valid date'
    })
  }

  if (typeof event.shortDescription !== 'string') {
    errors.push({
      field: 'shortDescription',
      message: 'ShortDescription must be a string'
    });
  }

  if (typeof event.longDescription !== 'string') {
    errors.push({
      field: 'longDescription',
      message: 'LongDescription must be a string'
    })
  }

  if (typeof event.image !== 'string') {
    errors.push({
      field: 'image',
      message: 'Image must be a string'
    })
  }

  if (typeof event.locationId !== 'number') {
    errors.push({
      field: 'locationId',
      message: 'LocationId must be a number'
    })
  }

  if (typeof event.latitude !== 'number') {
    errors.push({
      field: 'latitude',
      message: 'Latitude must be a number'
    })
  }

  if (typeof event.longitude !== 'number') {
    errors.push({
      field: 'longitude',
      message: 'Longitude must be a number'
    })
  }

  if (typeof event.tickets !== 'object' || event.tickets.length === 0) {
    errors.push({
      field: 'tickets',
      message: 'Tickets must be a list of tickets'
    })
  } else if (event.tickets.length > 20) {
    errors.push({
      field: 'tickets',
      message: 'Number of tickets can not be greater than 20'
    })
  } else {
    event.tickets.forEach(ticket => {
      if (typeof ticket.name !== 'string') {
        errors.push({
          field: 'name',
          message: 'Ticket must have a name'
        })
      }

      if (typeof ticket.price !== 'number') {
        errors.push({
          field: 'price',
          message: 'Ticket must have a price'
        })
      }

      if (typeof ticket.amount !== 'number') {
        errors.push({
          field: 'amount',
          message: 'Ticket must have an amount'
        })
      }
    });
  }

  return errors
}

function validateUpdateEvent(event, tickets) {
  const errors = []

  if (event.name && (typeof event.name !== 'string' || event.name === '')) {
    errors.push({
      field: 'name',
      message: 'Name must be a string'
    })
  }

  if (event.date && (typeof event.date !== 'string' || !isValidDate(new Date(event.date)))) {
    errors.push({
      field: 'date',
      message: 'Date is not valid'
    })
  }

  if (event.shortDescription && (typeof event.shortDescription !== 'string')) {
    errors.push({
      field: 'shortdDescription',
      message: 'ShortDescription must be a string'
    })
  }

  if (event.longDescription && (typeof event.longDescription !== 'string')) {
    errors.push({
      field: 'longDescription',
      message: 'LongDescription must be a string'
    })
  }

  if (event.image && (typeof event.image !== 'string' || event.image === '')) {
    errors.push({
      field: 'image',
      message: 'Image must be a string'
    })
  }

  if (event.locationId && (typeof event.locationId !== 'number')) {
    errors.push({
      field: 'locationId',
      message: 'LocationId must be a number'
    })
  }

  if (event.latitude && (typeof event.latitude !== 'number')) {
    errors.push({
      field: 'latitude',
      message: 'Latitude must be a number'
    })
  }

  if (event.longitude && (typeof event.longitude !== 'number')) {
    errors.push({
      field: 'longitude',
      message: 'Longitude must be a number'
    })
  }

  if (tickets && (typeof tickets !== 'object' || tickets.length === 0)) {
    errors.push({
      field: 'tickets',
      message: 'Tickets must be a list of tickets'
    })
  } else if (tickets){
    tickets.forEach(ticket => {
      if(ticket.id){
        if(typeof ticket.id !== 'number'){
          errors.push({
            field: 'id',
            message: 'Ticket id must be a number'
          })
        }
  
        if (ticket.name && typeof ticket.name !== 'string') {
          errors.push({
            field: 'name',
            message: 'Ticket must have a name'
          })
        }
  
        if (ticket.price && typeof ticket.price !== 'number') {
          errors.push({
            field: 'price',
            message: 'Ticket must have a price'
          })
        }
  
        if (ticket.amount && typeof ticket.amount !== 'number') {
          errors.push({
            field: 'amount',
            message: 'Ticket must have an amount'
          })
        }
      } else {
        if (typeof ticket.name !== 'string') {
          errors.push({
            field: 'name',
            message: 'Ticket must have a name'
          })
        }
  
        if (typeof ticket.price !== 'number') {
          errors.push({
            field: 'price',
            message: 'Ticket must have a price'
          })
        }
  
        if (typeof ticket.amount !== 'number') {
          errors.push({
            field: 'amount',
            message: 'Ticket must have an amount'
          })
        }
      }
     
    });
  }
  return errors
}

module.exports = {
  validateInsertEvent,
  validateUpdateEvent
}