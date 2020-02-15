//Needs limiter though!
const express = require('express')
const router = express.Router()
const {BAD_REQUEST,SYSTEM_ERROR} = require('../Messages')
const { catchErrors } = require('../helpers')
const adminHandler = require('../handlers/adminHandler')
const stream = require('stream')
const fs = require('fs')

async function eventsInfo(req,res){
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

router.get('/eventsInfo', catchErrors(eventsInfo))
router.get('/downloadTickets/:eventId', catchErrors(downloadTicketsXL))
router.post('/changeTicketState', catchErrors(changeTicketState))
module.exports = router