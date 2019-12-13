const express = require('express');
const validator = require('validator');
const xss = require('xss');

const router = express.Router()
const { catchErrors } = require('../helpers')

const {
  getEvents,
  insertEvent
} = require('../handlers/eventHandler')

async function getEventsRoute(req, res){
  const result = await getEvents()
  return res.json(result)
}

async function insertEventRoute(req, res){
  const {
    name,
    date,
    shortDescription,
    longDescription,
    locationId,
    latitude,
    longitude
  } = req.body
  

  const event = {
    name: xss(name),
    date: xss(date),
    shortDescription: xss(shortDescription),
    longDescription: xss(longDescription),
    locationId: xss(locationId),
    latitude: xss(latitude),
    longitude: xss(longitude)
  }

  const result = await insertEvent(event)

  return res.status(200).json(result);
}

router.get('/events', catchErrors(getEventsRoute))
router.post('/events', catchErrors(insertEventRoute))

module.exports = router