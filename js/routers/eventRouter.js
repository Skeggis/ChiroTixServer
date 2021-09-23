const express = require('express')
const multer = require('multer')
const fs = require('fs')
const router = express.Router()
const cloudinary = require('../cloudinary')
const { BAD_REQUEST } = require('../Messages')



const { catchErrors } = require('../helpers')

const {
  getEvents,
  insertEvent,
  getEventById,
} = require('../handlers/eventHandler')

const {
  getInsertValuesDb
} = require('../database/eventDb')

const {
  validateInsertEvent,
  validateUpdateEvent
} = require('../validation/eventValidation')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname)
  }
})


async function getEventsRoute(req, res) {
  const result = await getEvents()
  return res.json(result)
}

async function insertEventRoute(req, res) {
  const {
    name,
    startDate,
    endDate,
    organization,
    startSellingTime,
    finishSellingTime,
    shortDescription,
    longDescription,
    image,
    cityId,
    latitude,
    longitude,
    CECredits,
    tickets,
    speakers,
    tags,
    category,
    schedule
  } = req.body.data

  const event = {
    name,
    startDate,
    endDate,
    organization,
    startSellingTime,
    finishSellingTime,
    shortDescription,
    longDescription,
    image,
    cityId,
    latitude,
    longitude,
    CECredits,
    tickets,
    speakers,
    tags,
    category,
    schedule
  }

  const result = await insertEvent(event)
  if (result.success) {
    return res.status(200).json(result);
  }
  return res.status(400).json(result)
}

async function updateEventRoute(req, res) {
  const { id } = req.params

  const check = await getEventById(id)
  if (!check) {
    return res.status(404).json({ message: 'This event does not exist' })
  }

  const {
    name,
    shortDescription,
    longDescription,
    image,
    cityId,
    latitude,
    longitude,
    tickets
  } = req.body

  const updatedEvent = {
    name: name || null,
    date: date || null,
    shortDescription: shortDescription || null,
    longDescription: longDescription || null,
    image: image || null,
    cityId: cityId || null,
    latitude: latitude || null,
    longitude: longitude || null,
  }


  const errors = validateUpdateEvent(updatedEvent, tickets)
  if (errors.length > 0) {
    return res.status(400).json(errors)
  }
  const result = await updateEvent(id, updatedEvent, tickets)
  if (result.success) {
    return res.status(200).json(result)
  }

  return res.status(500).json({ success: false, message: 'Something went wrong updating event' })
}

async function uploadEventImageRoute(req, res) {
  const upload = multer({ storage }).any()
  upload(req, res, async function (err, result) {
    if (err) {
      console.log(err)
      return res.send(err)
    }

    const uploader = async (path) => await cloudinary.uploads(path, 'ChiroTix');

    const urls = []
    const files = req.files;
    console.log(files)
    for (const file of files) {
      const { path } = file;
      const newPath = await uploader(path)
      urls.push(newPath)
      fs.unlinkSync(path)
    }

    res.status(200).json({
      message: 'images uploaded successfully',
      data: urls
    })

  })
}

async function getInsertValuesRoute(req, res) {
  const result = await getInsertValuesDb()
  if (result.success) {
    return res.status(200).json(result.data)
  }

  return res.status(404).json(BAD_REQUEST("Could not process the request"))
}

async function getEvent(req, res) {
  const { id } = req.params
  let response = await getEventById(id)
  if(!response){return res.json(BAD_REQUEST("Could not find this event"))}
  res.json(response)
}

router.get('/insertValues', catchErrors(getInsertValuesRoute))
router.get('/event/:id', catchErrors(getEvent))
router.post('/events', catchErrors(insertEventRoute))
router.post('/eventImage', catchErrors(uploadEventImageRoute))

module.exports = router