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
    let anotherEvent;
    let buyerId;
    before(async function(){
        silenceBefore()
        ticketTypes = await testData.generateNewTicketTypes(3, amountsOfTickets)
        event = await testData.generateNewEvent({tickets:ticketTypes})
        const {id} = await insertEventDb(event)
        eventId = id

        anotherEvent = await testData.generateNewEvent()
        await insertEventDb(anotherEvent)
    })
    context('Buyer wants to buy tickets for an event and goes to the tickets selling page', async function () {
        it('should succeed to get information for the event the buyer wants to buy tickets for', async function () {

            const res = await agent
                .get(`/tickets/info/${eventId}`)

            expect(res.body).to.have.keys(['success', 'eventInfo', 'ticketTypes', 'buyerId'])
            expect(res.body.success).to.be.true
            expect(res.body.eventInfo.id).to.be.equal(eventId)
            expect(res.body.ticketTypes).to.have.lengthOf(ticketTypes.length)

            eventInfo = res.body.eventInfo
            ticketTypes = res.body.ticketTypes
            buyerId = res.body.buyerId
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
        it('should fail to reserve tickets of one type because there do not exist as many tickets as Buyer wants', async function(){
            let tickets = [ticketTypes[0]]
            tickets[0].amount++
            verbose()
            const res = await agent
            .post('/tickets/reserveTickets').send(getReserveData(buyerId, eventId, tickets, 'randomSocketId'))
            console.log(res.body)
        })
        it('should fail to reserve tickets of three types because there do not exist as many tickets as Buyer wants of each type')
        it('should fail to reserve tickets of three types because there do not exist as many tickets as Buyer wants of one type')
        it('should fail to reserve tickets because Buyer wants more tickets than the limit allows')
        it('should fail to reserve tickets because the event does not exist')
        it('should fail to reserve tickets because the buyerId was not sent/is undefined')
        it('should fail to reserve tickets because the socketId was not sent/is undefined')
        it('should fail to reserve tickets because the event-Id does not exist')
        it('should fail to reserve tickets because the ticketType-id represents a ticket that is not in-Sale anymore')
        it('should fail to reserve tickets because the ticketType-id does not exist')
        it('should fail to reserve tickets because the ticketType-id exists but references a different event than the one the Buyer is trying to reserve tickets for')


        it('should succeed to reserve tickets of one type')
        it('should succeed to reserve tickets of three types')
    })
})