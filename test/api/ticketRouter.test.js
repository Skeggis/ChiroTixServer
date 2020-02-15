const { silence, verbose, silenceBefore } = require('../helpers')
const expect = require('chai').expect;
const request = require('supertest')
const app = require('../../js/server')


const db = require('../../js/database/db')
const faker = require('faker')
const eventDb = require('../../js/database/eventDb')
const formatter = require('../../js/formatter')
const { insertEventDb } = require('../../js/database/eventDb')
const testData = require('../testData')
const {
    DB_CONSTANTS
} = require('../../js/helpers')


describe('#ticketRouter.js:', async function () {
    this.timeout(10000)
    const agent = request.agent(app);
    let amountsOfTickets = [10,100,1000]
    let event, eventId, eventInfo, ticketTypes;
    let anotherEvent, anotherEventId, anotherEventInfo, anotherTicketTypes;
    let buyerId, anotherBuyerId;
    let socketId = "randomSocketId"
    before(async function(){
        silenceBefore()
        ticketTypes = await testData.generateNewTicketTypes(3, amountsOfTickets)
        event = await testData.generateNewEvent({tickets:ticketTypes})
        let result = await insertEventDb(event)
        eventId = result.id

        anotherEvent = await testData.generateNewEvent()
        result = await insertEventDb(anotherEvent)
        anotherEventId = result.id

    })
    context('Buyer wants to buy tickets for an event and goes to the tickets selling page', async function () {
        it('should succeed to get information for the event the buyer wants to buy tickets for', async function () {

            let res = await agent
                .get(`/tickets/info/${eventId}`)

            expect(res.body).to.have.keys(['success', 'eventInfo', 'ticketTypes', 'buyerId'])
            expect(res.body.success).to.be.true
            expect(res.body.eventInfo.id).to.be.equal(eventId)
            expect(res.body.ticketTypes).to.have.lengthOf(ticketTypes.length)

            eventInfo = res.body.eventInfo
            ticketTypes = res.body.ticketTypes
            buyerId = res.body.buyerId

            res = await agent
                .get(`/tickets/info/${anotherEventId}`)

                console.log(res.body)
            expect(res.body).to.have.keys(['success', 'eventInfo', 'ticketTypes', 'buyerId'])
            expect(res.body.success).to.be.true

            anotherEventInfo = res.body.eventInfo
            anotherTicketTypes = res.body.ticketTypes
            anotherBuyerId = res.body.buyerId
        })
        it('should not succeed to get information for an event that does not exist', async function(){
            const res = await agent
                .get(`/tickets/info/-1`)
            const body = res.body

            expect(body).to.have.keys(['success', 'messages'])
            expect(body.success).to.be.false
            expect(body.messages).to.have.lengthOf(1)
        })
    })

    context('Buyer has chosen what types of tickets he wants and asks if he can reserve them', async function(){
        const getReserveData = (bId, eId,tT,sId) => {
            return {
                buyerId: bId,
                eventId: eId,
                ticketTypes: tT,
                socketId: sId
            }
        }
        async function checkDBForFailure(){}
        async function failPath(data){
            const res = await agent
            .post('/tickets/reserveTickets').send(data)

            expect(res.body).to.have.keys(['success','messages'])
            expect(res.body.success).to.be.false
            expect(res.body.messages).to.have.lengthOf(1)
        }
        it('should fail to reserve tickets of one type because there do not exist as many tickets as Buyer wants', async function(){
            let data = await getReserveData(buyerId, eventId,[{id:ticketTypes[0].id, amount:amountsOfTickets[0]+1}], socketId )
            await failPath(data)
        })
        it('should fail to reserve tickets of three types because there do not exist as many tickets as Buyer wants of each type', async function(){
            let tickets = JSON.parse(JSON.stringify(ticketTypes))
            for(let i = 0; i < amountsOfTickets.length; i++){tickets[i].amount = amountsOfTickets[i]+1}

            const res = await agent
            .post('/tickets/reserveTickets').send(getReserveData(buyerId, eventId, tickets, socketId))

            expect(res.body).to.have.keys(['success','messages'])
            expect(res.body.success).to.be.false
            expect(res.body.messages).to.have.lengthOf(tickets.length)
        })
        it('should fail to reserve tickets of three types because there do not exist as many tickets as Buyer wants of one type', async function(){
            let tickets = JSON.parse(JSON.stringify(ticketTypes))
            for(let i = 0; i < amountsOfTickets.length; i++){tickets[i].amount = amountsOfTickets[i]}
            tickets[0].amount++
            let data = await getReserveData(buyerId, eventId, tickets, socketId)
            await failPath(data)
        })
        it('should fail to reserve tickets because Buyer wants more tickets than the limit allows')
        it('should fail to reserve tickets because the event does not exist', async function (){
            let tickets = [{id:ticketTypes[0].id, amount:amountsOfTickets[0]}]
            let data = await getReserveData(buyerId, -1, tickets, socketId)
            await failPath(data)
        })
        it('should fail to reserve tickets because the buyerId was not sent/is undefined', async function (){
            let tickets = [{id:ticketTypes[0].id, amount:amountsOfTickets[0]}]
            await failPath(getReserveData(undefined, eventId, tickets, socketId))
        })
        it('should fail to reserve tickets because the socketId was not sent/is undefined', async function (){
            let tickets = [{id:ticketTypes[0].id, amount:amountsOfTickets[0]}]
            await failPath(getReserveData(buyerId, eventId, tickets, undefined))
        })
        it('should fail to reserve tickets because the ticketType-id represents a ticket that is not in-Sale anymore')
        it('should fail to reserve tickets because the ticketType-id does not exist', async function(){
            let tickets = [{id:-1, amount:amountsOfTickets[0]}]
            await failPath(getReserveData(buyerId, eventId, tickets, socketId))
        })
        it('should fail to reserve multiple types of tickets because one ticket-Id does not exist', async function(){
            let tickets = [{id:ticketTypes[0].id, amount:amountsOfTickets[0]},{id:-1, amount: 1}]
            await failPath(getReserveData(buyerId, eventId, tickets, socketId))
        })

        it('should fail to reserve tickets because the ticketType-id exists but references a different event than the one the Buyer is trying to reserve tickets for', async function(){
            let tickets = [{id:anotherTicketTypes[0].id, amount:2}]
            await failPath(buyerId, eventId, tickets, socketId)
        })

        it('should fail to reserve multiple tickets because the ticketType-id exists but references a different event than the one the Buyer is trying to reserve tickets for', async function(){
            let tickets = [{id:anotherTicketTypes[0].id, amount:2}, {id:ticketTypes[0].id, amount:2}]
            await failPath(getReserveData(buyerId, eventId, tickets, socketId))
        })

        it('should fail to reserve tickets of amount 0')
        it('should fail to reserve multiple tickets where all have amount 0')
        it('should succeed to reserve tickets where at least one type has amount > 0')

        it('should fail to reserve tickets because the event is not inSale')

        it('should fail to reserve tickets because the ticketTypes are not inSale')

        it('should fail to reserve tickets because one ticketType is not inSale')

        it('should succeed to reserve tickets of one type', async function(){
            let amountOfTickets = 3
            let tickets = [ticketTypes[0]]
            tickets[0].amount = amountOfTickets

            const res = await agent
            .post('/tickets/reserveTickets')
            .send(getReserveData(buyerId, eventId, tickets, socketId))
        
            expect(res.body).to.have.keys(['success', 'reservedTickets', 'timer', 'releaseTime'])
            expect(res.body.success).to.be.true
            expect(res.body.reservedTickets).to.have.lengthOf(3)
            expect(res.body.reservedTickets[0].ticketTypeId).to.equal(tickets[0].id)
        })
        it('should succeed to reserve tickets of three types', async function(){
            let amountOfTickets = 3
            let tickets = JSON.parse(JSON.stringify(ticketTypes))
            for(let i = 0; i < tickets.length; i++){tickets[i].amount = amountOfTickets}

            const res = await agent
            .post('/tickets/reserveTickets')
            .send(getReserveData(buyerId, eventId, tickets, socketId))
        
            expect(res.body).to.have.keys(['success', 'reservedTickets', 'timer', 'releaseTime'])
            expect(res.body.success).to.be.true
            expect(res.body.reservedTickets).to.have.lengthOf(amountOfTickets*tickets.length)
            expect(res.body.reservedTickets[0].ticketTypeId).to.equal(tickets[0].id)
        })

        it('should check that the reservedTickets gotten in the response are the tickets that the Buyer wanted (i.e. json structure is correct')
    })

    context('Buyer decides he does not want the tickets that he had reserved', async function(){
        it('should not release tickets because ...')
        it('should release all tickets that the buyer had reserved', async function(){
            verbose()
            const res = await agent
            .post('/tickets/releaseTickets')
            .send({buyerId, socketId, eventId})

            expect(res.body.success).to.be.true
        })
    })

    context('Buyer tries to buy tickets for an event', async function(){
        let theAmountsOfTickets = [1000,1000,1000,1000]
        let theEventId, theAnotherEventId;
        var theTicketTypes, theEventInfo;
        let theBuyerId;

        it('should succeed to buy random normal tickets for the event', async function(){
            let amountOfTickets = 3
            verbose()
            console.log(theTicketTypes)
            let tickets = [theTicketTypes[0], theTicketTypes[1]]
            tickets[0].amount = 0
            tickets[1].amount = 1
            let reservedTickets = await getReservedTickets(buyerId, eventId, tickets, socketId)
            verbose()
            console.log(reservedTickets)
        })
        this.beforeAll(async function(){
                silenceBefore()
                theTicketTypes = await testData.generateNewTicketTypes(theAmountsOfTickets.length, theAmountsOfTickets)
                let theEvent = await testData.generateNewEvent({tickets:theTicketTypes})
                let result = await insertEventDb(theEvent)
                theEventId = result.id
        
                let theAnotherEvent = await testData.generateNewEvent()
                result = await insertEventDb(theAnotherEvent)
                theAnotherEventId = result.id

                let res = await agent
                .get(`/tickets/info/${theEventId}`)

            expect(res.body).to.have.keys(['success', 'eventInfo', 'ticketTypes', 'buyerId'])
            expect(res.body.success).to.be.true
            expect(res.body.eventInfo.id).to.be.equal(theEventId)
            expect(res.body.ticketTypes).to.have.lengthOf(theTicketTypes.length)

            theEventInfo = res.body.eventInfo
            theTicketTypes = res.body.ticketTypes
            theBuyerId = res.body.buyerId

            res = await agent
                .get(`/tickets/info/${anotherEventId}`)

            expect(res.body).to.have.keys(['success', 'eventInfo', 'ticketTypes', 'buyerId'])
            expect(res.body.success).to.be.true

            theAnotherEventInfo = res.body.eventInfo
            theAnotherTicketTypes = res.body.ticketTypes
            theAnotherBuyerId = res.body.buyerId
        })

        async function getReservedTickets(bId, eId, theTickets, sId){
            const res = await agent
            .post('/tickets/reserveTickets')
            .send({
                buyerId: bId,
                eventId: eId,
                ticketTypes: theTickets,
                socketId: sId
            })
        
            expect(res.body).to.have.keys(['success', 'reservedTickets', 'timer', 'releaseTime'])
            expect(res.body.success).to.be.true
            expect(res.body.reservedTickets).to.have.lengthOf(3)
            expect(res.body.reservedTickets[0].ticketTypeId).to.equal(theTickets[0].id)

            return res.body.reservedTickets
        }

        // context('10 random buyer buy random tickets to the event all should succeed', async function(){
            
        // })
        
        it('should fail because no buyerId was sent/undefined')
        it('should fail because no eventId was sent/undefined')
        it('should fail because no tickets were sent/undefined')
        it('should fail because an empty array of tickets was sent')
        it('should fail because no buyerInfo was sent/undefined')
        it('should fail because no socketId was sent/undefined')

        it('should fail because the eventId does not represent an actual event (-1 or 100000000)')

        it('should fail because the ticketTypeIds do not reference the given eventId/event')
        it('should fail because one ticketTypeId does not reference the given eventId')
        it('should fail because the ticketTypeIds do not exist')
        it('should fail because one ticketTypeId does not exist')

        it('should fail because the ticketIds do not exist')
        it('should fail because the ticketIds are not reserved for this buyerId (they are reserved but for another buyer (buyerId))')


        it('he tries to buy tickets and sends two consecutive post-request, the second one should fail because he is in the process of buying the tickets (first request)')
        it('should fail because the tickets buyer is trying to buy do not match the tickets that he previously reserved')
        it('should fail because the tickets buyer is trying to buy are 1 more than those he reserved')
        it('should fail because the tickets buyer is trying to buy are 1 fewer than those he reserved')
        it('should fail because the ownerInfo of each ticket has incomplete information')
        it('should fail because one ticket has incomplete ownerInfo')
    })
})