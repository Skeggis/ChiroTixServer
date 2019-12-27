const router = require('express').Router()
const crypto = require('crypto')
const ticketHandler = require('../handlers/ticketHandler')
const {BAD_REQUEST} = require('../Messages')

const { catchErrors } = require('../helpers')

async function eventInfo(req, res){
    let eventId = req.params.eventId
    if(!eventId){return res.json(BAD_REQUEST("Invalid body request."))}

    let buyerId = crypto.randomBytes(20).toString('hex')
    let responseData = await ticketHandler.getEventInfoWithTicketTypes(eventId)
    if(!responseData){return res.json(BAD_REQUEST('No event with this id'))}
    responseData.buyerId = buyerId
    res.json(responseData)
}

/**
 * 
 * @param {JSON} req.body:{
 *          buyerId: String,
 *          eventId: Integer,
 *          ticketTypes: [{
 *              id: Integer,
 *              amount: Integer
 *          }]
 *        }
 */
async function reserveTickets(req, res){
    const {
            buyerId = false,
            eventId = false,
            ticketTypes = false,
            socketId=false
        
    } = req.body

    if(!(buyerId && eventId && ticketTypes && socketId)){ return res.json(BAD_REQUEST("Invalid body request.")) }
    if( ticketTypes.length === 0 ){ return res.json(BAD_REQUEST("Invalid amount of tickets. Zero tickets not allowed."))}

    const data = {
        buyerId,
        eventId,
        ticketTypes
    }
    console.log('her')
    var response = await ticketHandler.reserveTickets(data)
    console.log(response)
    if(!response.success){return res.json(BAD_REQUEST("System error.") )}
    let io = req.app.get('io')
    console.log('asdfasdf')
    console.log(response.ownerInfos)
    let timer = await calculateTime(response.ownerInfos, response.reservedTickets.length)
    io.sockets.connected[socketId].timer = timer
    let now = new Date()
    let releaseDate = new Date(now.getTime()+(timer))
    io.sockets.connected[socketId].releaseTime = releaseDate
    response.timer = timer
    response.releaseTime = releaseDate
    res.json(response)
}

async function calculateTime(ownerInfos, ticketsAmount){
    let ONE_MINUTE = 60000
    let time = ONE_MINUTE*7 //7 minutes for billingInfo
    console.log('asdf')
    ownerInfos.forEach(info => {
        console.log('info', info)
        time += info.length*ONE_MINUTE 
    })
    //time += (ownerInfo.length)*ONE_MINUTE*ticketsAmount //One minute for each input
    time += ONE_MINUTE*10 //Ten minutes for the payment step
    console.log(time)
    return time
}


/**
 * 
 * @param {Object} req.body: {
 *                  eventId: Integer,
 *                  buyerId: String,
 *                  tickets: [{
 *                      ticketTypeId: Integer,
 *                      ownerInfo: {
 *                              name: String,
 *                              SSN: String (?)
 *                          }
 *                  }],
 *                  buyerInfo : {
 *                      name: String,
 *                      email: String,
 *                      SSN: String (?)
 *                  },
 *                  cardInformaition: {?}
 * } 
 */
async function buyTickets(req, res){
    const {
        body: {
            buyerId = false,
            eventId = false,
            tickets = false,
            buyerInfo = false,
            cardInformation = false,
            insurance = false,
            insurancePrice = 0,
            ticketTypes = false
        }
    } = req

    console.log("BUYIT:", req.body)
    if(!(buyerId && eventId && tickets && buyerInfo)){ return res.json(BAD_REQUEST("Invalid body request.")) }
    if( tickets.length === 0 ){ return res.json(BAD_REQUEST("Invalid amount of tickets. Zero tickets not allowed."))}

    const data = {
        buyerId,
        eventId,
        tickets,
        buyerInfo,
        insurance,
        insurancePrice,
        ticketTypes
    }

    //Todo - send email

    var response = await ticketHandler.buyTickets(data)
    res.json(response)
}


/**
 * 
 * @param {Object} req.body: {
 *                  eventId: Integer,
 *                  buyerId: String,
 *                  tickets : [{
 *                      ticketTypeId: Integer,
 *                      id: Integer
 *                  }]
 * }
 */
async function releaseTickets(req,res){
    const {
        body: {
            buyerId = false,
            eventId = false,
            tickets = false
        }
    } = req

    console.log("GETIT!", req.body)
    if(!(buyerId && eventId && tickets)){ return res.json(BAD_REQUEST("Invalid body request.")) }
    if( tickets.length === 0 ){ return res.json(BAD_REQUEST("Invalid amount of tickets. Zero tickets not allowed."))}

    const data = {
        buyerId,
        eventId,
        tickets
    }

    var response = await ticketHandler.releaseTickets(data)
    res.json(response)
}

/**
 * 
 * @param {Object} req.body: {
 *                  eventId: Integer,
 *                  buyerId: String
 * }
 */
// async function releaseAllTickets(req,res){
//     const {
//         body: {
//             buyerId = false,
//             eventId = false
//         }
//     } = req

//     if(!(buyerId && eventId )){ return res.json(BAD_REQUEST("Invalid body request.")) }

//     const data = {
//         buyerId,
//         eventId
//     }

//     var response = await ticketHandler.releaseAllTicketsForBuyer(data)
//     res.json(response)
// }


router.get('/tickets/info/:eventId', catchErrors(eventInfo))
router.post('/tickets/reserveTickets', catchErrors(reserveTickets))
router.post('/tickets/buyTickets', catchErrors(buyTickets))
router.post('/tickets/releaseTickets', catchErrors(releaseTickets))
// router.post('/releaseAllTickets', catchErrors(releaseAllTickets))
module.exports = router