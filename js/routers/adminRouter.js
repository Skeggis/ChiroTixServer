//Needs limiter though!
const express = require('express')
const router = express.Router()
const {BAD_REQUEST,SYSTEM_ERROR} = require('../Messages')
const { catchErrors } = require('../helpers')
const adminHandler = require('../handlers/adminHandler')
const stream = require('stream')
const fs = require('fs')

async function eventsInfo(req,res){
    console.log("HERE")
    /**
     * events : [{
     *          eventInfo: {},
     *          ticketTypes: [{}]
     * }]
     */
    let events = await adminHandler.getEventsInfoWithTicketTypes()
    if(!events){return res.send(SYSTEM_ERROR())}
    res.send({success:true, events})
}

async function downloadTicketsXL(req, res){
    let id = req.params.eventId
    let response = await adminHandler.getTicketsXLSheetFor(id, res)
    if(!response){return res.send(SYSTEM_ERROR())}

    res.set('Content-disposition', 'attachment; filename=data.xlsx');
    res.set('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(response.buffer)
}

async function changeTicketState(req, res){
    const {
        ticketTypeId = -1
    } = req.body

    let ticket = await adminHandler.changeTicketState(ticketTypeId)
    if(!ticket){return res.json({success:false, messages:[{message:"could not something somehting", type:"error"}]})}
    res.json({success:true, ticket:ticket})
}

async function changeEventState(req, res){
    const {
        isSelling = null,
        isSoldOut = null,
        isVisible = null,
        eventId = -1
    } = req.body
    if(eventId === -1 || (isSelling === null || isSoldOut === null || isVisible === null)){return res.json(BAD_REQUEST('Kommon bró'))}
    let response = await adminHandler.changeEventState({eventId, isSelling, isSoldOut, isVisible})
    res.json(response)
    // console.log("response:", response)
}

router.get('/eventsInfo', catchErrors(eventsInfo))
router.get('/downloadTickets/:eventId', catchErrors(downloadTicketsXL))
router.post('/changeTicketState', catchErrors(changeTicketState))
router.post('/changeEventState', catchErrors(changeEventState))
module.exports = router