require('dotenv').config();
const db = require('./db');
const formatter = require('../formatter')
const {SYSTEM_ERROR} = require('../Messages')

const {
    TAGS_DB,
    TAGS_CONNECT_DB,
    EVENTS_DB,
    SPEAKERS_DB,
    SPEAKERS_CONNECT_DB,
    LOCATIONS_DB,
    ORGANIZATIONS_DB
} = process.env;

/**
 * 
 * @param {Object} param0 :{
 *              searchString: String,
 *              organizations: [Integer],
 *              countries: [Integer],
 *              cities: [Integer],
 *              tags: [Integer],
 *              speakers: [Integer],
 *              categories: [Integer],
 *              dates:{
 *                  startDate: String (date),
 *                  endDate: String (Date)
 *              },
 *              price:{
 *                  minPrice: Integer (double?),
 *                  maxPrice: Integer (double?)
 *              },
 *              CECredits:{
 *                  minCredits: Integer,
 *                  maxCredits: Integer
 *              }
 *              
 * }
 */
async function search({searchString='', organizations=[], countries=[],
cities=[], tags=[], speakers=[], categories=[], dates={},price={},CECredits={}}){
let query = `select * from `
}


module.exports = {search}