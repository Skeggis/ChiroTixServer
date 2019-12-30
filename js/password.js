require('dotenv').config()
const bcrypt = require('bcryptjs');

const {
    SALT
} = process.env

/**
 * 
 * @param {string} password | the password
 * @param {string} hashedPassword | hashed password to compare to the password
 */
async function comparePasswords(password, hashedPassword) {
    const isPassword = await new Promise((resolve, reject) => {
        if (!hashedPassword || !password) { resolve(false) }
        bcrypt.compare(password, hashedPassword, function (err, isMatch) {
            if (err) reject(err)
            resolve(isMatch)
        })
    })
    return isPassword
}

/**
 * 
 * @param {string} pass | the password
 */
async function hashPassword(pass) {
    const password = pass
    const saltRounds = parseInt(SALT);

    const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, function (err, hash) {
            if (err) reject(err)
            resolve(hash)
        });
    })

    return hashedPassword
}

module.exports = { comparePasswords, hashPassword }