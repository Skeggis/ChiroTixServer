require('dotenv').config()
const ticketHandler = require('../js/handlers/ticketHandler')
const expect = require('chai').expect;

describe('TicketHandler test', async () => {
    let reservedTicketsForBuyer;
    let reservedTicketsForOtherBuyer;

    describe('Reserve tickets', async () => {
        it('should find 50 tickets of same type and reserve them', async () => {
            let data = {
                tickets: [{
                    ticketId: global.tickets[0].id,
                    amount: 50
                }],
                eventId: global.event.id,
                buyerId: global.buyerId
            }
            
            let response = await ticketHandler.reserveTickets(data)
            expect(response.success, "The tickets where not found").to.be.true
            expect(response.reservedTickets.length).to.equal(50)
            reservedTicketsForBuyer = response.reservedTickets
        })

        it('should not reserve 51 tickets of the same type as the first buyer had reserved, bc there are only 100 tickets available, and get error message', async () => {
            let data = {
                tickets: [{
                    ticketId: global.tickets[0].id,
                    amount: 51
                }],
                eventId: global.event.id,
                buyerId: global.otherBuyerId
            }
            
            let response = await ticketHandler.reserveTickets(data)
            expect(response.success, "The tickets where not found").to.be.false
            expect(response.ticketsError.length).to.equal(1)
        })
    
        it('should not find 101 tickets of same type and reserve them, and get error message', async () => {
            let data = {
                tickets: [{
                    ticketId: global.tickets[1].id,
                    amount: 101
                }],
                eventId: global.event.id,
                buyerId: global.buyerId
            }
            
            let response = await ticketHandler.reserveTickets(data)
    
            expect(response.success, "The tickets where not found").to.be.false
            expect(response.ticketsError.length, "There should only be one error message").to.be.equal(1)
        })
    
        it('should find 3 tickets of each type and reserve them for the otherbuyer', async () => {
            let data = {
                tickets: [{
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
                }],
                eventId: global.event.id,
                buyerId: global.otherBuyerId
            }
    
            let response = await ticketHandler.reserveTickets(data)
    
            expect(response.success, "The tickets where not found").to.be.true
            expect(response.reservedTickets.length).to.equal(9)
            reservedTicketsForOtherBuyer = response.reservedTickets
        })
    
        it('should find 10 tickets of type 1 and 3 but not of type 2 and get error message accordingly', async () => {
            let data = {
                tickets: [{
                    ticketId: global.tickets[0].id,
                    amount: 10
                },
                {
                    ticketId: global.tickets[1].id,
                    amount: 10
                },
                {
                    ticketId: global.tickets[2].id,
                    amount: 10
                }],
                eventId: global.event.id,
                buyerId: global.otherBuyerId
            }
    
            let response = await ticketHandler.reserveTickets(data)
    
            expect(response.success, "The tickets where found but should not have been found").to.be.false
            expect(response.reserveTickets).to.be.undefined
            expect(response.ticketsError.length, "There should only be one error message (only for type 2 ticket)").to.be.equal(1)
        })
    })

    describe('Buy tickets', async () => {
        it('should buy 50 tickets that buyer reserved', async () => {
            let data = {
                tickets: reservedTicketsForBuyer,
                eventId: global.event.id,
                buyerId: global.buyerId,
                buyerInfo: global.buyerInfo
            }

            let response = await ticketHandler.buyTickets(data)
            expect(response.success).to.be.true
            expect(response.boughtTickets.length).to.equal(50)
        })

        it('should not buy tickets, because otherbuyer is trying to buy more tickets than he has reserved and get Error message', async () => {
            let data = {
                tickets: reservedTicketsForBuyer,
                eventId: global.event.id,
                buyerId: global.otherBuyerId,
                buyerInfo: global.otherBuyerInfo
            }

            let response = await ticketHandler.buyTickets(data)
            expect(response.success).to.be.false
            expect(response.boughtTickets).to.be.undefined
            expect(response.messages.length).to.equal(1)
        })
        
        it('should not buy tickets, because otherbuyer is trying to buy less tickets than he has reserved and get Error message', async () => {
            let data = {
                tickets: [reservedTicketsForOtherBuyer[0], reservedTicketsForOtherBuyer[5]],
                eventId: global.event.id,
                buyerId: global.otherBuyerId,
                buyerInfo: global.otherBuyerInfo
            }

            let response = await ticketHandler.buyTickets(data)
            expect(response.success).to.be.false
            expect(response.boughtTickets).to.be.undefined
            expect(response.messages.length).to.equal(1)
        })

        it('should not buy tickets for invalid buyerId and get Error message', async () => {
            let data = {
                tickets: [reservedTicketsForOtherBuyer[0], reservedTicketsForOtherBuyer[5]],
                eventId: global.event.id,
                buyerId: -1,
                buyerInfo: global.otherBuyerInfo
            }

            let response = await ticketHandler.buyTickets(data)
            expect(response.success).to.be.false
            expect(response.boughtTickets).to.be.undefined
            expect(response.messages.length).to.equal(1)
        })

        it('should buy 9 tickets that otherbuyer reserved', async () => {
            let data = {
                tickets: reservedTicketsForOtherBuyer,
                eventId: global.event.id,
                buyerId: global.otherBuyerId,
                buyerInfo: global.otherBuyerInfo
            }

            let response = await ticketHandler.buyTickets(data)
            expect(response.success).to.be.true
            expect(response.boughtTickets.length).to.equal(9)
        })
    })

    describe('Release Tickets', async () => {
        it('should reserve 2 tickets and release 1', async () => {
            let data = {
                tickets: [{
                    ticketId: global.tickets[0].id,
                    amount: 2
                }],
                eventId: global.event.id,
                buyerId: global.buyerId
            }
            
            let response = await ticketHandler.reserveTickets(data)
            expect(response.success, "The tickets where not found").to.be.true
            expect(response.reservedTickets.length).to.equal(2)
            let reservedTickets = [response.reservedTickets[0]]

            data.tickets = reservedTickets
            response = await ticketHandler.releaseTickets(data)
            expect(response.success).to.be.true
        })

        it('should fail to release too many tickets', async () => {
            let data = {
                tickets: reservedTicketsForBuyer,
                eventId: global.event.id,
                buyerId: global.buyerId
            }

            response = await ticketHandler.releaseTickets(data)
            expect(response.success).to.be.false
            expect(response.messages.length).to.equal(1)
        })
    })

    describe('Release all Tickets', async () => {
        it('should reserve 10 tickets and release all', async () => {
            let newBuyerId = "Manni"
            let data = {
                tickets: [{
                    ticketId: global.tickets[0].id,
                    amount: 10
                }],
                eventId: global.event.id,
                buyerId: newBuyerId
            }
            
            let response = await ticketHandler.reserveTickets(data)
            expect(response.success, "The tickets where not found").to.be.true
            expect(response.reservedTickets.length).to.equal(10)

            data.tickets = undefined
            response = await ticketHandler.releaseAllTicketsForBuyer(data)
            expect(response.success).to.be.true
        })
    })



});