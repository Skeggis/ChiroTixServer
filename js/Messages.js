const SYSTEM_ERROR = {
    success: false, 
    messages:[  {type: "Error", message:"System error. Please try again later."} ]
  }

const BAD_REQUEST = (message) => {
  return {
    success: false,
    messages: [{type: "Error", message:message}]
  }
}

const CREATED = (message) => {
  return {
    success: true,
    messages: [{type: "Success", message:message}]
  }
}
  
module.exports = {
        SYSTEM_ERROR,
        BAD_REQUEST,
        CREATED
}