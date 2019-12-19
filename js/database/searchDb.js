const db = require('./db');
const formatter = require('../formatter')
const {DB_CONSTANTS} = require('../helpers')
const featuredLimit = 15

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
 *                  minCECredits: Integer,
 *                  maxCECredits: Integer
 *              }
 *              
 * }
 */
function search({searchString='', organizations=[], countries=[],
cities=[], categories=[], tags=[], speakers=[],  dates={},price={},CECredits={}}){
    let query = `select * from ${DB_CONSTANTS.SEARCHEVENTS_DB} where`
    let zingle = false
    if(organizations.length > 0){ query += ` ${organizationsSearchQuery(organizations)}`; zingle=true}
    if(countries.length > 0){ query += `${zingle ? ' and':''} ${countriesSearchQuery(countries)}`; zingle=true}
    if(cities.length > 0){ query += `${zingle ? ' and':''} ${citiesSearchQuery(cities)}`; zingle=true}
    if(categories.length > 0){ query += `${zingle ? ' and':''} ${categoriesSearchQuery(categories)}`; zingle=true}
    if(tags.length > 0){ query += `${zingle ? ' and':''} ${tagsSearchQuery(tags)}`; zingle=true}
    if(speakers.length > 0){ query += `${zingle ? ' and':''} ${speakersSearchQuery(speakers)}`; zingle=true}
    if(dates.startDate && dates.endDate){ query += `${zingle ? ' and':''} ${datesSearchQuery(dates.startDate, dates.endDate)}`; zingle=true}
    if(price.minPrice && price.maxPrice){ query += `${zingle ? ' and':''} ${priceSearchQuery(price.minPrice, price.maxPrice)}`; zingle=true}
    if(CECredits.minCECredits && CECredits.maxCECredits){ query += `${zingle ? ' and':''} ${CECreditsSearchQuery(CECredits.minCECredits, CECredits.maxCECredits)}`; zingle=true}
    if(searchString){ query += `${zingle ? ' and':''} ${searchStringQuery(searchString)}`; zingle=true}
    if(!zingle){ query = `select * from ${DB_CONSTANTS.SEARCHEVENTS_DB} order by featurednr asc limit ${featuredLimit}`}

    let result = await db.query(query)
    let events = await formatter.formatEvents(result.rows)
    return events
}

function searchStringQuery(searchString){ return `${DB_CONSTANTS.SEARCHEVENTS_DB}.textsearchable_index_col @@ plainto_tsquery('${searchString}')` }

function organizationsSearchQuery(organizations){ return `(${DB_CONSTANTS.SEARCHEVENTS_DB}.organizationid = Any('{${organizations.toString()}}'))` }

function countriesSearchQuery(countries){ return `(${DB_CONSTANTS.SEARCHEVENTS_DB}.countryid = Any('{${countries.toString()}}'))` }

function citiesSearchQuery(cities){ return `(${DB_CONSTANTS.SEARCHEVENTS_DB}.cityid = Any('{${cities.toString()}}'))` }

function categoriesSearchQuery(categories){ return `(${DB_CONSTANTS.SEARCHEVENTS_DB}.categoryid = Any('{${categories.toString()}}'))` }

function tagsSearchQuery(tags){ return `(${DB_CONSTANTS.SEARCHEVENTS_DB}.tagsids @> '{${tags.toString()}}')` } //Iff all tags are the same

function speakersSearchQuery(speakers){ return `(${DB_CONSTANTS.SEARCHEVENTS_DB}.speakersids && '{${speakers.toString()}}')` } //Iff all speakers are the same

function datesSearchQuery(startDate, endDate){ return `(${startDate} <= ${DB_CONSTANTS.SEARCHEVENTS_DB}.startdate and ${DB_CONSTANTS.SEARCHEVENTS_DB}.enddate <= ${endDate})` }

function priceSearchQuery(minPrice, maxPrice){ return `(${minPrice} <= ${DB_CONSTANTS.SEARCHEVENTS_DB}.minprice and ${DB_CONSTANTS.SEARCHEVENTS_DB}.maxprice <= ${maxPrice})` }

function CECreditsSearchQuery(minCECredits, maxCECredits){ return `(${minCECredits} <= ${DB_CONSTANTS.SEARCHEVENTS_DB}.cecredits and ${maxCECredits} <= ${DB_CONSTANTS.SEARCHEVENTS_DB}.cecredits)` }




module.exports = {search}