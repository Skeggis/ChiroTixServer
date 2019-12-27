/**
 * This module is responsible for setting up the database by
 * running all the sql scripts.
 */


require('dotenv').config();

const fs = require('fs');
const util = require('util');
const {DB_CONSTANTS} = require('../helpers')

const { query } = require('./db');

const connectionString = process.env.DATABASE_URL;
const readFileAsync = util.promisify(fs.readFile);



/**
 * Run all the sql scripts.
 */
async function main() {
  console.info(`Initializing database on ${connectionString}`);

  const check = await query(`SELECT EXISTS (
    SELECT 1 
    FROM   pg_catalog.pg_class c
    JOIN   pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = '${DB_CONSTANTS.EVENTS_DB}'  
    );`)
    
  if (check.rows[0].exists) {
    const res = await query(`SELECT * FROM ${DB_CONSTANTS.EVENTS_DB}`)
    let tables
   for(i = 0; i< res.rows.length; i++){
     tables+=res.rows[i].ticketstablename
    if(i < res.rows.length -1){
      tables += ','
    }
   }
  
    await query(`DROP TABLE IF EXISTS ${tables}`)
  }

  await query(`DROP VIEW IF EXISTS ${DB_CONSTANTS.EVENTS_INFO_VIEW}`)
  // drop tables if exists
  await query(`DROP TABLE IF EXISTS ${DB_CONSTANTS.SEARCH_EVENTS_DB}, ${DB_CONSTANTS.ORDERS_DB}, ${DB_CONSTANTS.SPEAKERS_CONNECT_DB}, ${DB_CONSTANTS.SPEAKERS_DB}, ${DB_CONSTANTS.TICKETS_TYPE_DB}, 
  ${DB_CONSTANTS.EVENTS_DB},${DB_CONSTANTS.CITIES_DB}, ${DB_CONSTANTS.COUNTRIES_DB}, ${DB_CONSTANTS.TAGS_DB}, ${DB_CONSTANTS.TAGS_CONNECT_DB}, ${DB_CONSTANTS.ORGANIZATIONS_DB}, ${DB_CONSTANTS.CATEGORIES_DB}, ${DB_CONSTANTS.SPEAKERS_CONNECT_DB}`);
  console.info('Tables deleted');

  // create tables from schemas
  try {
    const categories = await readFileAsync('./sql/categories.sql');
    const countries = await readFileAsync('./sql/countries.sql');
    const cities = await readFileAsync('./sql/cities.sql');
    const events = await readFileAsync('./sql/events.sql');
    const ticketTypes = await readFileAsync('./sql/ticketType.sql')
    const tags = await readFileAsync('./sql/tags.sql')
    const tagsConnect = await readFileAsync('./sql/tagsConnect.sql')
    const speakers = await readFileAsync('./sql/speakers.sql');
    const speakersConnect = await readFileAsync('./sql/speakersConnect.sql');
    const organizations = await readFileAsync('./sql/organizations.sql');
    const searchEvents = await readFileAsync('./sql/searchEvents.sql')
    const eventsInfoView = await readFileAsync('./sql/eventsInfoView.sql')
    const orders = await readFileAsync('./sql/orders.sql')
    


    await query(categories.toString('utf8'));
    await query(organizations.toString('utf8'));
    await query(countries.toString('utf8'));
    await query(cities.toString('utf8'));
    await query(events.toString('utf8'));
    await query(ticketTypes.toString('utf8'));
    await query(tags.toString('utf8'));
    await query(tagsConnect.toString('utf8'));
    await query(speakers.toString('utf8'));
    await query(speakersConnect.toString('utf8'));
    await query(searchEvents.toString('utf8'))
    await query(eventsInfoView.toString('utf8'))
    await query(orders.toString('utf8'))


    await query(`CREATE INDEX textsearch_idx ON ${DB_CONSTANTS.SEARCH_EVENTS_DB} USING GIN (textsearchable_index_col);`)


    console.info('Tables created');
  } catch (e) {
    console.error('Error creating tables:', e.message);
    return;
  }

  // insert data into tables
  try {
    const insert = await readFileAsync('./sql/insert.sql');
    await query(insert.toString('utf8'))

    console.info('Data inserted');
  } catch (e) {
    console.error('Error inserting data:', e.message);
  }
}


main().catch((err) => {
  console.error(err);
});
