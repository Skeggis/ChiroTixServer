const tagsDb = require('../database/tagsDb')
const router = require('express').Router()
const {BAD_REQUEST, CREATED} = require('../Messages')
const { catchErrors } = require('../helpers')

async function insertTag(req,res){
    const {
        tag=false //String
    } = req.body

    if(!tag) {return res.status(400).json(BAD_REQUEST("Invalid body request."))}

    let newTag = await tagsDb.insertTag(tag)
    if(newTag){
        let message = CREATED("The tag was created.")
        message.tag = newTag
        res.status(201).json(message)
    }
    res.status(400).json(BAD_REQUEST("Could not process the request"))
}

async function insertTags(req, res){
    const {
        tags=false //Array of strings
    } = req.body

    if(!tags || tags.length === 0) {return res.status(400).json(BAD_REQUEST("Invalid body request."))}

    let newTags = await tagsDb.insertTags(tags)
    if(newTags){
        let message = CREATED("The tags were created.")
        message.tags = newTags
        res.status(201).json(message)
    }
    res.status(400).json(BAD_REQUEST("Could not process the request"))
}

async function deleteTag(req,res){
    const {
        tagId=false //Integer
    } = req.body

    if(!tagId) {return res.status(400).json(BAD_REQUEST("Invalid body request."))}

    let success = await tagsDb.deleteTag(tagId)
    if(success){res.status(201).json(CREATED("The tag was deleted."))}
    res.status(400).json(BAD_REQUEST("Could not process the request"))
}

async function deleteTags(req,res){
    const {
        tagIds=false //Array of Integers
    } = req.body

    if(!tagIds || tagIds.length === 0) {return res.status(400).json(BAD_REQUEST("Invalid body request."))}

    let success = await tagsDb.deleteTags(tagIds)
    if(success){return res.status(201).json(CREATED("The tags were deleted."))}
    res.status(400).json(BAD_REQUEST("Could not process the request"))
}

async function getTags(req, res){
    const{
        tagIds=false //Array of Integers
    } = req.body

    if(!tagIds || tagIds.length === 0) {return res.status(400).json(BAD_REQUEST("Invalid body request."))}

    let tags = await tagsDb.getTags(tagIds)
    if(tags){return res.status(201).json({success:true, tags})}
    res.status(400).json(BAD_REQUEST("Could not process the request"))
}

async function getAllTags(req,res){
    let tags = await tagsDb.getAllTags
    if(success){return res.status(201).json({success:true, tags})}
    res.status(404).json(BAD_REQUEST("Could not process the request"))
}

router.post('/insertTag', catchErrors(insertTag))
router.post('/insertTags', catchErrors(insertTags))
router.post('/deleteTag', catchErrors(deleteTag))
router.post('/deleteTags', catchErrors(deleteTags))
router.post('/getTags', catchErrors(getTags))
router.get('/getAllTags', catchErrors(getAllTags))
module.exports = router