const {
  query
} = require('./db');

const {
  EVENTS_DB
} = process.env

async function getEventsDb(){
  return await query(`SELECT * FROM ${EVENTS_DB}`);
}

async function insertEventDb(event){
  const myEvent = {
    name: event.name, 
    date: event.date.length,
    shortdescription: event.shortdescription,
    longdescription: event.longdescription,
    image: event.image,
    locationid: event.locationid,
    longitude: event.longitude,
    latitude: event.latitude,
  }
  return await query(`INSERT INTO ${EVENTS_DB} (name, date, shortdescription, longdescription, image, locationid, longitude, latitude)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, Object.values(myEvent))
}

module.exports = {
  getEventsDb,
  insertEventDb
}