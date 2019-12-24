const express = require('express')
const multer = require('multer')
const router = express.Router()
const { BAD_REQUEST } = require('../Messages')



const { catchErrors } = require('../helpers')

const {
  getEvents,
  insertEvent,
  updateEvent,
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
  destination: function(req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function(req, file, cb) {
    console.log(file)
    cb(null, file.originalname)
  }
})


async function getEventsRoute(req, res){
  const result = await getEvents()
  return res.json(result)
}

async function insertEventRoute(req, res){
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
    category
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
    category
  }

  const result = await insertEvent(event)
  if(result.success){
    return res.status(200).json(result);
  }
  return res.status(400).json(result)
}

async function updateEventRoute(req, res){
  const { id } = req.params

  const check = await getEventById(id)
  if(!check){
    return res.status(404).json({message: 'This event does not exist'})
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
  if(errors.length > 0){
    return res.status(400).json(errors)
  }
  const result = await updateEvent(id, updatedEvent, tickets)
  if(result.success){
    return res.status(200).json(result)
  }

  return res.status(500).json({success: false, message: 'Something went wrong updating event'})
}

async function uploadEventImageRoute(req, res){
  const upload = multer({storage}).single('image')
  upload(req, res, function(err){
    if(err){
      console.log(err)
      return res.send(err)
    }
    
    const cloudinary = require('cloudinary').v2
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_KEY,
      api_secret: process.env.CLOUD_SECRET
    })

    const path = req.file.path
    const uniqueFilename = new Date().toISOString();
    console.log(path)

    cloudinary.uploader.upload(
      path,
      { public_id: `ChiroTix/${uniqueFilename}` },
      function(err, image) {
        if (err) return res.send(err)
        console.log('file uploaded to Cloudinary')
        // remove file from server
        const fs = require('fs')
        fs.unlinkSync(path)
        // return image details
        res.json(image)
      }
    )
  })
}

async function getInsertValuesRoute(req, res){
  const result = await getInsertValuesDb()
  if(result.success) {
    return res.status(200).json(result.data)
  }

  return res.status(404).json(BAD_REQUEST("Could not process the request"))
}

async function getEvent(req, res){
  const { id } = req.params
  let response = await getEventById(id)
  res.json(response)
}




router.get('/events', catchErrors(getEventsRoute))
router.get('/event/:id', catchErrors(getEvent))
router.post('/events', catchErrors(insertEventRoute))
router.patch('/events/:id', catchErrors(updateEventRoute))
router.post('/eventImage', catchErrors(uploadEventImageRoute))
router.get('/insertValues', catchErrors(getInsertValuesRoute))


module.exports = router