require('dotenv').config()
const {silence,verbose} = require('../helpers')
const expect = require('chai').expect;
const {insertEventDb} = require('../../js/database/eventDb')
const db = require('../../js/database/db')
const {
    NORMAL_EVENT,
    NEW_SPEAKERS,
    NEW_ORGANIZATIONS,
    TICKET_TYPES,
    TAGS_IDS
} = require('../testData')

const ticketDb = require('../../js/database/ticketDb')


const {
    TICKETS_TYPE_DB
} = process.env;
//TODO: change description into TDD (i.e. descriping the functions not behavior of buyer)
//TODO: Check DB, somehow elegantly.
describe('#ticketDb.js', async function (){
    silence()
    let buyerId='myBuyerId'
    let ticketTypes;
    let eventId;
    let eventInfo;
    let ticketsReservedForBuyer = []

    before(async function () {
        let event = {
            ...NORMAL_EVENT,
            speakers: NEW_SPEAKERS,
            organization: NEW_ORGANIZATIONS[0],
            tickets: TICKET_TYPES,
            tags: TAGS_IDS
        }
        const {id} = await insertEventDb(event)
        eventId = id
    })

    context('.getEventInfoWithTicketTypes: A site visitor goes to buy tickets for an event', async function(){
        it('should return the event information and ticket types available to buy for the correct event', async function(){
            let event = await ticketDb.getEventInfoWithTicketTypes(eventId)

            expect(event).to.have.keys(['eventInfo', 'ticketTypes'])
            expect(event.eventInfo.id).to.be.equal(eventId)

            eventInfo = event.eventInfo
            ticketTypes = event.ticketTypes
        })

        it('should return an error because the event id supplied is not associated to an event', async function(){
            let event = await ticketDb.getEventInfoWithTicketTypes(-1)

            expect(event).to.be.false
        })
    })

    context(".reserveTickets: A potential buyer wants to reserve tickets to an event", async function () {

        async function failPath(eId, bId, theTickets){
            let result = await ticketDb.reserveTickets(eId, bId, theTickets)

            expect(result.success).to.be.false
            expect(result).to.have.keys('success','messages')
            expect(result.messages).to.be.an('array')
            expect(result.messages.length).to.be.above(0)
        }

        async function successPath(eId, bId, theTickets){
            let expLength = 0
            for(let i = 0; i < theTickets.length; i++){expLength += theTickets[i].amount}

            let result = await ticketDb.reserveTickets(eId, bId, theTickets)

            expect(result.success).to.be.true
            expect(result).to.have.keys('reservedTickets','success')
            expect(result.reservedTickets).to.have.a.lengthOf(expLength) //TODO: also check if the IDs of the reserved tickets matches those of theTickets

            ticketsReservedForBuyer = ticketsReservedForBuyer.concat(result.reservedTickets)
        }

        it('should succeed to reserve 2 tickets of the type he wants.', async function(){ await successPath(eventId, buyerId, [{id:ticketTypes[0].id, amount:2}]) })

        it('should succeed to reserve 2 tickets of both the types he wants.', async function(){ await successPath(eventId, buyerId, [{id:ticketTypes[0].id, amount:2},{id:ticketTypes[1].id, amount:2}]) })

        it('should fail to reserve tickets because there are not as many tickets available as the buyer wants', async function(){ await failPath(eventId, buyerId,[{id:ticketTypes[0].id, amount:10000}]) })

        it('should fail to reserve tickets because there are not as many tickets available as the buyer wants of one type', async function(){ await failPath(eventId, buyerId,[{id:ticketTypes[0].id, amount:1},{id:ticketTypes[1].id, amount:10000}]) })

        it('should fail because an invalid ticketTypeId was given', async function(){ await failPath(eventId, buyerId, [{id:"nammi", amount:2}]) })
    
        it('should fail because an invalid buyerId was given', async function(){ await failPath(eventId, undefined, [{id:ticketTypes[0].id, amount:2}]) })
    })


    context('.getAllReservedTicketsForBuyer: ', async function(){
        it('should get all the tickets that this buyer has reserved', async function(){
            let result = await ticketDb.getAllReservedTicketsForBuyer(buyerId, eventId)

            expect(result).to.have.lengthOf(ticketsReservedForBuyer.length)
        })

        it('should get no tickets because this buyerId has no reserved tickets', async function(){
            let result = await ticketDb.getAllReservedTicketsForBuyer('matur', eventId)

            expect(result).to.have.lengthOf(0)
        })

        it('should fail to get the tickets because the eventId does not exist', async function(){
            let result = await ticketDb.getAllReservedTicketsForBuyer(buyerId, -1)

            expect(result).to.be.false
        })

        
    })

    //TODO: releaseAllTicketsForBuyer returns true also iff the query fails, because this is only a cleanup function therefore we dont want 
    // the user to see an error if it fails, but we should handle it differently!
    context('.releaseAllTicketsForBuyer: A potential buyer wants to rethink his actions and leaves the site or goes back to step 1', async function(){
        beforeEach(async function(){ await ticketDb.reserveTickets(eventId, buyerId, [{id:ticketTypes[0].id, amount:2}]) })

        it('should release all the tickets that he had reserved before', async function(){
            let success = await ticketDb.releaseAllTicketsForBuyer(buyerId,eventId)

            expect(success).to.be.true 
        })

        it.skip('should fail to release all the tickets because an incorrect eventId was given', async function(){
            let success = await ticketDb.releaseAllTicketsForBuyer(buyerId, -1)

            expect(success).to.be.false
        })
    })


    context('.getTicketTypes: ', async function(){
        
        it('should get the ticketTypes for the event', async function(){
            let ids = []
            for(let i = 0; i < ticketTypes.length; i++){ids.push(ticketTypes[i].id)}

            let types = await ticketDb.getTicketTypes(ids)

            expect(types).to.have.lengthOf(ticketTypes.length)
        })

        it('should fail to get the ticketTypes for the event because the ids are invalid', async function(){
            let ids = ["matur", ticketTypes[0].id]

            let types = await ticketDb.getTicketTypes(ids)
            
            expect(types).to.be.false
        })

        it('should fail to get the ticketTypes for the event because there are no tickets with the ids given', async function(){
            let ids = [-1,-3]

            let types = await ticketDb.getTicketTypes(ids)

            expect(types).to.be.false
        })
    })

    //It is too simple of a function to test (!?)
    context('.getTicketTypesOfEvent', async function(){})


    //Sinon, i.e. buy tickets but stop the doneBuying function from being called.
    context('.isBuying:', async function(){

    })

    context('.doneBuying', async function(){})

    context('.getAllTicketsSoldIn', async function(){})

    context('.buyTickets', async function(){})




})