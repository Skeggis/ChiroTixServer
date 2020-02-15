const usersDb = require('../database/usersDb')
const {hashPassword} = require('../password')
const { SYSTEM_ERROR } = require('../Messages')

async function createUser({ name = '', email = '', password = '', confirmPassword = '' }) {
    let errorMessages = [];
  
    if (!name || !email || !password || !confirmPassword) {
      errorMessages.push('Please enter all fields');
    }
  
    var passErrorMessages = await arePasswordRequirementsMet(password, confirmPassword)
    if (passErrorMessages.length > 0) { errorMessages.push(...passErrorMessages) }
  
    if (errorMessages.length > 0) { return {success: false, messages: errorMessages} } 
    else {
      let user = await usersDb.getUserFromEmail(email)
      if (user) { return {success:false, messages:[{type: "error", message:"Email is taken"}]} } 
      else {
        var newUser = {
          name,
          email,
          password
        }
        const hashedPassword = await hashPassword(newUser.password)
        if (hashedPassword) {
          newUser.password = hashedPassword
          let dbUser = await usersDb.createUser(newUser)
          newUser.password = password
          if (!dbUser) { return SYSTEM_ERROR() } 
          else { return {success: true, user: newUser} }
        } 
        else { return SYSTEM_ERROR() }
      }
    }
  }

  async function arePasswordRequirementsMet(password, confirmedPassword) {
    var messages = []
    if (password != confirmedPassword) { messages.push({type:"error",message:'Passwords do not match'}); }
    if (password.length < 8) { messages.push({type:"error",message:'Password must be at least 8 characters'}); }
    return messages
  }


module.exports = {createUser}