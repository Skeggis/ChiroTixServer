const express = require('express')
const multer = require('multer')
const router = express.Router()
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
  validateInsertEvent
} = require('../validation/eventValidation')

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname)
  }
})


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
  if(result.success){
    return res.status(200).json(result);
  }
  return res.status(400).json(result)
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

router.get('/insertValues', catchErrors(getInsertValuesRoute))
router.get('/event/:id', catchErrors(getEvent))
router.post('/events', catchErrors(insertEventRoute))
router.post('/eventImage', catchErrors(uploadEventImageRoute))

module.exports = router