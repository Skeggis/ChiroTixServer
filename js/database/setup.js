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


/**
 * Run all the sql scripts.
 */
async function main() {
  console.info(`Initializing database on ${connectionString}`);

  // drop tables if exists
  await query('DROP TABLE IF EXISTS ticketsconnect, tickets, events, locations');

  console.info('Tables deleted');

  // create tables from schemas
  try {
    const locations = await readFileAsync('./sql/locations.sql');
    const events = await readFileAsync('./sql/events.sql');
    const ticketTypes = await readFileAsync('./sql/ticketType.sql')
    const ticketConnect = await readFileAsync('./sql/ticketConnect.sql')


    await query(locations.toString('utf8'));
    await query(events.toString('utf8'));
    await query(ticketTypes.toString('utf8'));
    await query(ticketConnect.toString('utf8'));


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
