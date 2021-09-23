const SYSTEM_ERROR =  () => {
  return {
    success: false, 
    messages:[  {type: "Error", message:"System error. Please try again later."} ]
  }
}

const BAD_REQUEST = (message, title="Error!") => {
  return {
    success: false,
    messages: [{type: "Error", message:message, title:title}],
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