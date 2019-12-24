const db = require('./db');
const formatter = require('../formatter')
const {DB_CONSTANTS} = require('../helpers')
const featuredLimit = 15
const {SYSTEM_ERROR} = require('../Messages')


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
async function search({searchString='', organizations=[], countries=[],
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
    //TOdo: format
    let events = await formatter.formatSearchEvents(result.rows)
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


async function GetInitialSearchDb(){
    const client = await db.getClient()
    let message={
        success: false,
        messages: [],
        result: {}
    }
    try{
        await client.query('BEGIN')
        //Get categories
        const categories = await client.query(`select * from ${DB_CONSTANTS.CATEGORIES_DB}`)
        message.result.categories=categories.rows

        //Do we need to verify that each city is connected to a country?
        //Get cities (that has an event in it)?
        const cities = await client.query(`select cities.id, cities.name, cities.countryid 
            from ${DB_CONSTANTS.CITIES_DB} as cities INNER JOIN ${DB_CONSTANTS.EVENTS_DB} as events 
            on cities.id = events.cityid GROUP BY cities.id`)
        message.result.cities=cities.rows

        //Get countries (that have an event in it?) 
        const countries = await client.query(`select countries.id, countries.name 
            from ${DB_CONSTANTS.COUNTRIES_DB} as countries INNER JOIN ${DB_CONSTANTS.CITIES_DB} as cities
            on countries.id = cities.countryid INNER JOIN ${DB_CONSTANTS.EVENTS_DB} as events on 
            cities.id = events.cityid GROUP BY countries.id`)
        message.result.countries = countries.rows

        //Get organizations (that are holding events?)
        const orgs = await client.query(`select orgs.id, orgs.name from ${DB_CONSTANTS.ORGANIZATIONS_DB}
            as orgs INNER JOIN ${DB_CONSTANTS.EVENTS_DB} as events on events.organizationid = orgs.id`)
        message.result.organizations = orgs.rows

        //Get tags (that is connected to a event (a event that has not finished?)?)
        const tags = await client.query(`select tags.id, tags.name from ${DB_CONSTANTS.TAGS_DB} as tags
         INNER JOIN ${DB_CONSTANTS.TAGS_CONNECT_DB} as connect on tags.id = connect.tagid INNER JOIN ${DB_CONSTANTS.EVENTS_DB} as events on events.id = connect.eventid GROUP BY tags.id`)
        message.result.tags = tags.rows

        //Get speakers (taht are speaking in a evnet?)
        const speakers = await client.query(`select * from ${DB_CONSTANTS.SPEAKERS_DB}`)
        message.result.speakers = speakers.rows

        //Featured events
        const featured = await client.query(`select * from ${DB_CONSTANTS.SEARCHEVENTS_DB} order by featurednr asc limit ${featuredLimit}`)
       console.log(featured.rows)
        message.result.featured = featured.rows

        await client.query('COMMIT')
        message.success = true
    } catch (e){
        await client.query('ROLLBACK')
        console.log("Get search values error: ", e)
        message = SYSTEM_ERROR
      } finally {
        client.end()
      }
      return message
}


module.exports = {
    search,
    GetInitialSearchDb
}