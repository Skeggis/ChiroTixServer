require('dotenv').config()
const LocalStrategy = require('passport-local').Strategy;
const { comparePasswords } = require('./password')
const { getUserFromEmail } = require('./database/usersDb')

module.exports = function (passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async function (email, password, done) {
      try {
        var user = await getUserFromEmail(email)
        console.log('user',user)
        if (user) {
          if (await comparePasswords(password, user.password)) {
            return done(null, user)
          }
          else {
            return done(null, false, { messages: [{type: "error", message:'Password incorrect' }] } )
          }
        }
        else { 
          
          return done(null, false, { messages: [{type: "error", message:'Wrong username or password' }] }) }

      } catch (error) {
        return done(true, false, { messages: [{type: "error", message: 'Could not connect to server. Please try again later.' }] } )
      }
    }));
}