const { silence, verbose, silenceBefore } = require('../helpers')
const expect = require('chai').expect;
const { insertEventDb } = require('../../js/database/eventDb')
const db = require('../../js/database/db')

const testData = require('../testData')

const {
    TAGS_IDS,
    RECEIPT
} = testData

const faker = require('faker')
const ticketDb = require('../../js/database/ticketDb')
const formatter = require('../../js/formatter')
const {
    DB_CONSTANTS
} = require('../../js/helpers')

const {
    ORDERS_DB,
    TICKETS_TYPE_DB
} = DB_CONSTANTS;
//TODO: change description into TDD (i.e. descriping the functions not behavior of buyer)
//TODO: Check DB, somehow elegantly for reserve- and releaseTickets.
describe('#ticketDb.js', async function () {
    silence()
    let buyerId = 'myBuyerId'
    let ticketTypes;
    let eventId;
    let eventInfo;
    let ticketsReservedForBuyer = []

    before(async function () {
        silenceBefore()
        this.timeout(5000)
        let event = await testData.generateNewEvent()
        const {id} = await insertEventDb(event)
        eventId = id
    })

    context('.getEventInfoWithTicketTypes: A site visitor goes to buy tickets for an event', async function () {
        it('should return the event information and ticket types available to buy for the correct event', async function () {
            let data = await ticketDb.getEventInfoWithTicketTypes(eventId)
            expect(data).to.have.keys(['event','success', 'insurancePercentage'])
            expect(data.event).to.have.keys(['eventInfo', 'ticketTypes'])
            expect(data.event.eventInfo.id).to.be.equal(eventId)

            eventInfo = data.event.eventInfo
            ticketTypes = data.event.ticketTypes
        })

        it('should return an error because the event id supplied is not associated to an event', async function () {
            let data = await ticketDb.getEventInfoWithTicketTypes(-1)

            expect(data).to.have.keys(['success', 'messages'])
            expect(data.success).to.be.false
            expect(data.messages).to.have.length(1)
        })
    })

    context(".reserveTickets: A potential buyer wants to reserve tickets to an event", async function () {

        async function failPath(eId, bId, theTickets) {
            let result = await ticketDb.reserveTickets(eId, bId, theTickets)
            expect(result.success).to.be.false
            expect(result).to.have.keys('success', 'messages')
            expect(result.messages).to.be.an('array')
            expect(result.messages.length).to.be.above(0)
        }

        async function successPath(eId, bId, theTickets) {
            let expLength = 0
            for (let i = 0; i < theTickets.length; i++) { expLength += theTickets[i].amount }

            let result = await ticketDb.reserveTickets(eId, bId, theTickets)

            expect(result.success).to.be.true
            expect(result).to.have.keys('reservedTickets', 'success')
            expect(result.reservedTickets).to.have.a.lengthOf(expLength) //TODO: also check if the IDs of the reserved tickets matches those of theTickets

            ticketsReservedForBuyer = ticketsReservedForBuyer.concat(result.reservedTickets)
        }

        it('should succeed to reserve 2 tickets of the type he wants.', async function () { await successPath(eventId, buyerId, [{ ...ticketTypes[0], amount: 2 }]) })

        it('should succeed to reserve 2 tickets of both the types he wants.', async function () { await successPath(eventId, buyerId, [{ ...ticketTypes[0], amount: 2 }, { ...ticketTypes[1], amount: 2 }]) })

        it('should fail to reserve tickets because there are not as many tickets available as the buyer wants', async function () { await failPath(eventId, buyerId, [{ ...ticketTypes[0], amount: 10000 }]) })

        it('should fail to reserve tickets because there are not as many tickets available as the buyer wants of one type', async function () { await failPath(eventId, buyerId, [{ ...ticketTypes[0], amount: 1 }, { ...ticketTypes[1], amount: 10000 }]) })

        it('should fail because an invalid ticketTypeId was given', async function () { await failPath(eventId, buyerId, [{ id: "nammi", amount: 2 }]) })

        it('should fail because an invalid buyerId was given', async function () { await failPath(eventId, undefined, [{ ...ticketTypes[0], amount: 2 }]) })
    })


    context('.getAllReservedTicketsForBuyer: ', async function () {
        it('should get all the tickets that this buyer has reserved', async function () {
            let result = await ticketDb.getAllReservedTicketsForBuyer(buyerId, eventId)

            expect(result).to.have.lengthOf(ticketsReservedForBuyer.length)
        })

        it('should get no tickets because this buyerId has no reserved tickets', async function () {
            let result = await ticketDb.getAllReservedTicketsForBuyer('matur', eventId)

            expect(result).to.have.lengthOf(0)
        })

        it('should fail to get the tickets because the eventId does not exist', async function () {
            let result = await ticketDb.getAllReservedTicketsForBuyer(buyerId, -1)

            expect(result).to.be.false
        })


    })

    //TODO: releaseAllTicketsForBuyer returns true also iff the query fails, because this is only a cleanup function therefore we dont want 
    // the user to see an error if it fails, but we should handle it differently!
    context('.releaseAllTicketsForBuyer: A potential buyer wants to rethink his actions and leaves the site or goes back to step 1', async function () {
        beforeEach(async function () { await ticketDb.reserveTickets(eventId, buyerId, [{ ...ticketTypes[0], amount: 2 }]) })

        it('should release all the tickets that he had reserved before', async function () {
            let success = await ticketDb.releaseAllTicketsForBuyer(buyerId, eventId)

            expect(success).to.be.true
        })

        it.skip('should fail to release all the tickets because an incorrect eventId was given', async function () {
            let success = await ticketDb.releaseAllTicketsForBuyer(buyerId, -1)

            expect(success).to.be.false
        })
    })


    context('.getTicketTypes: ', async function () {

        it('should get the ticketTypes for the event', async function () {
            let ids = []
            for (let i = 0; i < ticketTypes.length; i++) { ids.push(ticketTypes[i].id) }

            let types = await ticketDb.getTicketTypes(ids, eventId)

            expect(types).to.have.lengthOf(ticketTypes.length)
        })

        it('should fail to get the ticketTypes for the event because the ids are invalid', async function () {
            let ids = ["matur", ticketTypes[0].id]

            let types = await ticketDb.getTicketTypes(ids, eventId)

            expect(types).to.be.false
        })

        it('should fail to get the ticketTypes for the event because there are no tickets with the ids given', async function () {
            let ids = [-1, -3]

            let types = await ticketDb.getTicketTypes(ids, eventId)

            expect(types).to.be.false
        })
    })

    //It is too simple of a function to test (!?)
    context('.getTicketTypesOfEvent', async function () { })

    //Sinon, i.e. buy tickets but stop the doneBuying function from being called.
    context('.isBuying:', async function () { it('isBuyingTest') })

    context('.doneBuying', async function () { it('doneBuyingTest') })

    context('.getAllTicketsSoldIn', async function () { it('getAllTicketsSoldInTest') })

    context('.buyTickets: ', async function () {
        let myReservedTickets;
        let reservedTicketIds;
        let amounts = [2, 1]

        beforeEach(async function () {
            reservedTicketIds = []
            let tickets = []
            for (let i = 0; i < amounts.length; i++) {
                tickets.push({
                    ...ticketTypes[i],
                    amount: amounts[i]
                })
            }
            myReservedTickets = (await ticketDb.reserveTickets(eventId, buyerId, tickets)).reservedTickets
            for (let i = 0; i < myReservedTickets.length; i++) {
                myReservedTickets[i].ownerInfo[0].value = faker.name.findName()
                reservedTicketIds.push(myReservedTickets[i].id)
            }
        })

        context('Test when the component fails and when it succeeds', async function () {
            async function failPath(eId, bId, tickets, bInfo, receipt) {
                let result = await ticketDb.buyTickets(eId, bId, tickets, bInfo, receipt)

                expect(result.success).to.be.false
                expect(result).to.have.keys(['success', 'messages'])
                expect(result.messages).to.have.lengthOf(1)
            }

            it('should succeed to buy the tickets for the buyer', async function () {
                let result = await ticketDb.buyTickets(eventId, buyerId, myReservedTickets, (await testData.generateNewBuyerInfo()), RECEIPT)

                expect(result.success).to.be.true
                expect(result).to.have.keys(['success', 'boughtTickets', 'orderDetails', 'eventInfo', 'chiroInfo'])
                expect(result.boughtTickets).to.have.lengthOf(myReservedTickets.length)
            })

            it('should fail to buy the tickets for the buyer because an invalid id was given', async function () { await failPath(-1, buyerId, myReservedTickets, (await testData.generateNewBuyerInfo()), RECEIPT) })

            it('should fail to buy the tickets for the buyer because an invalid buyerId was given', async function () { await failPath(eventId, 'sucker', myReservedTickets, (await testData.generateNewBuyerInfo()), RECEIPT) })
        })

        context('Test wether the data was inserted into the Db correctly on a successful boughtTickets', async function () {
            let orderDetails;
            let eventInfo;
            let ticketTypesBefore;
            let ticketTypeIds;
            let THE_BUYER_INFO;
            //The "Act" is in the beforeEach but we check. TODO: Add sinon so that each database query is its own function in buyTickets(), and sinon spies on each (?)
            this.beforeEach('Before buyTickets Database Check', async function () {
                ticketTypeIds = []
                THE_BUYER_INFO = await testData.generateNewBuyerInfo()
                for (let i = 0; i < myReservedTickets.length; i++) { ticketTypeIds.push(myReservedTickets[i].ticketTypeId) }
                let result = await db.query(`Select * from ${TICKETS_TYPE_DB} where id=Any('{${ticketTypeIds.toString()}}') order by id`)
                ticketTypesBefore = result.rows

                result = await ticketDb.buyTickets(eventId, buyerId, myReservedTickets, THE_BUYER_INFO, RECEIPT)

                expect(result.success).to.be.true

                orderDetails = result.orderDetails
                eventInfo = result.eventInfo
            })

            it('should insert buy order correctly into OrdersDB', async function () {
                let result = await db.query(`select * from ${ORDERS_DB} where orderid='${orderDetails.orderId}'`)
                let insertedOrderDetails = await formatter.formatOrderDetails(result.rows[0])

                expect(insertedOrderDetails).to.include({ orderId: orderDetails.orderId, eventId: eventId })
                expect(insertedOrderDetails).to.have.property('tickets').which.is.an('array').and.eqls(myReservedTickets)
                expect(insertedOrderDetails).to.have.property('buyerInfo').which.is.an('object').and.eqls(THE_BUYER_INFO)
                expect(insertedOrderDetails).to.have.property('receipt').which.is.an('object').and.eqls(RECEIPT)
            })

            //TODO: Add assertion for ownerInfo etc. not just for isSold!
            it('should update the reserved tickets in ticketsSold table with the ownerInfo and isSold=true, etc', async function () {
                let result = await db.query(`select * from ${eventInfo.ticketsTableName} where id=Any('{${reservedTicketIds.join(',')}}') order by id`)
                let tickets = await formatter.formatTickets(result.rows)

                expect(tickets).to.have.lengthOf(reservedTicketIds.length)
                for (let i = 0; i < tickets.length; i++) { expect(tickets[i]).to.include({ isSold: true }) }
            })

            it('should update ticketTypes table, i.e. decrement reserved and increment sold', async function () {
                let result = await db.query(`Select * from ${TICKETS_TYPE_DB} where id=Any('{${ticketTypeIds.toString()}}') order by id`)
                expect(result).to.have.property('rows').which.is.an('array').with.length.of.at.least(1)
                for (let i = 0; i < amounts.length; i++) {
                    expect(result.rows[i].sold).to.equal(ticketTypesBefore[i].sold + amounts[i])
                    expect(result.rows[i].reserved).to.equal(ticketTypesBefore[i].reserved - amounts[i])
                }
            })
        })

        context('test that data was not inserted when unsuccessful bought tickets', async function() {
            it.skip('Test DB on ERROR')
        })



    })




})