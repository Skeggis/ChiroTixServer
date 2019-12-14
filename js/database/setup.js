/**
 * This module is responsible for setting up the database by
 * running all the sql scripts.
 */


require('dotenv').config();

const fs = require('fs');
const util = require('util');

const { query } = require('./db');

const connectionString = process.env.DATABASE_URL;
const readFileAsync = util.promisify(fs.readFile);

const {
  EVENTS_DB,
  TICKETS_TYPE_DB,
} = process.env



/**
 * Run all the sql scripts.
 */
async function main() {
  console.info(`Initializing database on ${connectionString}`);

  const check = await query(`SELECT EXISTS (
    SELECT 1 
    FROM   pg_catalog.pg_class c
    JOIN   pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = '${EVENTS_DB}'  
    );`)
    
  if (check.rows[0].exists) {
    const res = await query(`SELECT * FROM ${EVENTS_DB}`)
    let tables
   for(i = 0; i< res.rows.length; i++){
     tables+=res.rows[i].ticketstablename
    if(i < res.rows.length -1){
      tables += ','
    }
   }
  
    await query(`DROP TABLE IF EXISTS ${tables}`)
  }

  // drop tables if exists
  await query('DROP TABLE IF EXISTS locations, events, tickets, ticketsconnect');



  console.info('Tables deleted');

  // create tables from schemas
  try {
    const locations = await readFileAsync('./sql/locations.sql');
    const events = await readFileAsync('./sql/events.sql');
    const tickets = await readFileAsync('./sql/ticketType.sql');




    await query(locations.toString('utf8'));
    await query(events.toString('utf8'));
    await query(tickets.toString('utf8'));




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
