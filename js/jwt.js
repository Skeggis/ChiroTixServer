require('dotenv').config()
var jwt = require('jsonwebtoken');
var crypto = require('crypto')
var secret = process.env.JWT_SECRET

async function verify(token){
    return new Promise(function(resolve, reject){
        jwt.verify(token, secret, function(err, decode){
            if (err){
                reject(err)
                return
            }
            resolve(decode)
        })
    })
}

module.exports = {

    signUniqueUser: async function(obj){
        obj.tokenID = (await crypto.randomBytes(20)).toString('hex')
        return jwt.sign(obj, secret)
    },

    sign: function(obj){ return jwt.sign(obj, secret) },

    verify,

    allowUserAccess: async function(token){
        try { 
            if(await verify(token)){return true}
            return false 
        } 
        catch (error) { return false }
    }
}