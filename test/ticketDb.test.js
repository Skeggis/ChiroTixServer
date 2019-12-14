require('dotenv').config()
const ticketDB = require('../js/database/ticketDb')
const expect = require('chai').expect;
const db = require('../js/database/db')

const {
    TICKETS_TYPE_DB,
    TICKETS_CONNECT_DB
} = process.env;

describe('TicketDb test', async () => {
    let reservedTicketsForBuyer;
    let reservedTicketsForOtherBuyer;

    describe('GetTicketTypes', async () => {
        it(`should find a ticket of certain type`, async () => {
            let ticketTypes = await ticketDB.getTicketTypes([global.tickets[0].id])
            expect(ticketTypes.length).to.be.equal(1)
            expect(ticketTypes[0].id).to.equal(global.tickets[0].id)
            expect(ticketTypes[0].name).to.equal(global.tickets[0].name)
        })
    
        it('should not find a ticket with invalid id', async () => {
            let response = await ticketDB.getTicketTypes([-1])
            expect(response.length).to.equal(0)
        })
    
        it('should find tickets of multiple types', async () => {
            let response = await ticketDB.getTicketTypes([global.tickets[0].id, global.tickets[1].id, global.tickets[2].id])
            expect(response.length).to.equal(3)
        })
    })

    describe('Reserve tickets', async () => {
        it('should reserve 3 tickets of type 1', async () => {
            let tickets = [{
                ticketId: global.tickets[0].id,
                amount: 3
            }]

            let response = await ticketDB.reserveTickets(global.event.id, global.buyerId, tickets)
            expect(response.success).to.be.true
            expect(response.reservedTickets.length).to.equal(3)

            reservedTicketsForBuyer = response.reservedTickets

            //Checking DB:
            let result = await db.query(`select * from ${global.ticketsSoldTableName} where buyerid = '${global.buyerId}';`)
            expect(result.rows.length).to.be.equal(3)

            result = await db.query(`select * from ${TICKETS_TYPE_DB} where id = ${global.tickets[0].id};`)
            expect(result.rows[0].reserved).to.equal(3)

            result = await db.query(`select * from ${TICKETS_TYPE_DB} where id = ${global.tickets[1].id};`)
            expect(result.rows[0].reserved).to.equal(0)

            result = await db.query(`select * from ${TICKETS_TYPE_DB} where id = ${global.tickets[2].id};`)
            expect(result.rows[0].reserved).to.equal(0)
        })

        it('should fail to insert and then rollback', async () => {
            let tickets = [{
                ticketId: global.tickets[0].id,
                amount: 3
            }]

            let response = await ticketDB.reserveTickets(null, global.buyerId, tickets)
            expect(response.success).to.be.false
            expect(response.messages.length).to.be.equal(1)

            //Checking wether the DB rolled back the reserved tickets because of later failure.
            let result = await db.query(`select * from ${TICKETS_TYPE_DB} where id = ${tickets[0].ticketId};`)
            expect(result.rows[0].reserved).to.be.equal(3)
        })

        it('should reserve 3 tickets of each type', async () => {
            let tickets = [{
                ticketId: global.tickets[0].id,
                amount: 3
            },
            {
                ticketId: global.tickets[1].id,
                amount: 3
            },
            {
                ticketId: global.tickets[2].id,
                amount: 3
            }]

            let response = await ticketDB.reserveTickets(global.event.id, global.otherBuyerId, tickets)
            expect(response.success).to.be.true
            expect(response.reservedTickets.length).to.equal(9)

            reservedTicketsForOtherBuyer = response.reservedTickets

            //Checking DB
            let result = await db.query(`select * from ${global.ticketsSoldTableName} where buyerid = '${global.otherBuyerId}';`)
            expect(result.rows.length).to.be.equal(9)

            result = await db.query(`select * from ${TICKETS_TYPE_DB} where id = Any('{${global.tickets[0].id}, ${global.tickets[1].id}, ${global.tickets[2].id}}');`)
            expect(result.rows[0].reserved).to.be.equal(6)
            expect(result.rows[1].reserved).to.be.equal(3)
            expect(result.rows[2].reserved).to.be.equal(3)
        })
    })

    describe('Get Reserved tickets', async () => {
        
        it("should get buyer's reserved tickets", async () => {
            let reservedTickets = await ticketDB.getAllReservedTicketsForBuyer(global.buyerId, global.event.id)
            expect(reservedTickets.length).to.equal(3)
        })

        it("should get zero reserved tickets for new buyer", async () => {
            let reservedTickets = await ticketDB.getAllReservedTicketsForBuyer(-1, global.event.id)
            expect(reservedTickets.length).to.equal(0)
        })

    })

    describe('Buy tickets', async () => {
        it('should buy 3 tickets for first buyer', async () => {
            let response = await ticketDB.buyTickets(global.event.id, global.buyerId, reservedTicketsForBuyer,global.buyerInfo,{} )
            
            expect(response.success).to.be.true
            expect(response.boughtTickets.length).to.equal(3)

            //Checking DB
            let result = await db.query(`select * from ${global.ticketsSoldTableName} where buyerid = '${global.buyerId}' and issold = true;`)
            expect(result.rows.length).to.be.equal(3)

            result = await db.query(`select * from ${TICKETS_TYPE_DB} where id=${reservedTicketsForBuyer[0].ticketId}`)
            expect(result.rows.length).to.be.equal(1)
            expect(result.rows[0].sold).to.equal(3)
            expect(result.rows[0].reserved).to.equal(3)

        })

        it('should buy 2 tickets each of different types for otherBuyer but leave the third alone', async () => {
            let tickets = [reservedTicketsForOtherBuyer[0], reservedTicketsForOtherBuyer[5]]
            let response = await ticketDB.buyTickets(global.event.id, global.otherBuyerId, tickets,global.otherBuyerInfo,{})
            
            expect(response.success).to.be.true
            expect(response.boughtTickets.length).to.equal(2)

            //Checking DB
            let result = await db.query(`select * from ${global.ticketsSoldTableName} where buyerid = '${global.otherBuyerId}' and issold = true 
            and ticketid=Any('{${reservedTicketsForOtherBuyer[0].ticketId}, ${reservedTicketsForOtherBuyer[5].ticketId}}');`)
            expect(result.rows.length).to.be.equal(2)

            result = await db.query(`select * from ${TICKETS_TYPE_DB} where id=${reservedTicketsForOtherBuyer[0].ticketId}`)
            expect(result.rows.length).to.be.equal(1)
            expect(result.rows[0].sold).to.equal(4)
            expect(result.rows[0].reserved).to.equal(2)

            result = await db.query(`select * from ${TICKETS_TYPE_DB} where id=${reservedTicketsForOtherBuyer[5].ticketId}`)
            expect(result.rows.length).to.be.equal(1)
            expect(result.rows[0].sold).to.equal(1)
            expect(result.rows[0].reserved).to.equal(2)
        })
    })

    describe('Release tickets', async () => {
        it('should reserve 2 tickets and release 1', async () => {
            let tickets = [{
                ticketId: global.tickets[0].id,
                amount: 2
            }]

            let response = await ticketDB.reserveTickets(global.event.id, global.buyerId, tickets)
            expect(response.success).to.be.true
            expect(response.reservedTickets.length).to.equal(2)

            let reservedTickets = response.reservedTickets
            let ticketsTypesAmount = []
            ticketsTypesAmount[reservedTickets[0].ticketId] = 1

            response = await ticketDB.releaseTickets([reservedTickets[0].id], ticketsTypesAmount, global.event.id)
            expect(response.success).to.be.true

            result = await db.query(`select * from ${TICKETS_TYPE_DB} where id=${global.tickets[0].id}`)
            expect(result.rows.length).to.be.equal(1)
            expect(result.rows[0].sold).to.equal(4)
            expect(result.rows[0].reserved).to.equal(3)
        })
    })

    describe('clean up DB tests', async () => {
        it('should clean up', async () => {
            let query = `delete from ${TICKETS_CONNECT_DB}`
            await db.query(query)
    
            query = `update ${TICKETS_TYPE_DB} set sold = 0, reserved = 0`
            await db.query(query)
    
            await db.query(`delete from ${global.ticketsSoldTableName}`);
        })
    })
    
});

