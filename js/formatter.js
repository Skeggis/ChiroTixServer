async function formatTicketType(ticket){
    return {
        id: ticket.id,
        price: ticket.price,
        name: ticket.name,
        amount: ticket.amount,
        sold: ticket.sold,
        reserved: ticket.reserved,
        date: ticket.date
    }
}

async function formatTicketTypes(ticketTypes){
    let newTickets = []
    for(let i = 0; i < ticketTypes.length; i++){ newTickets.push(await formatTicketType(ticketTypes[i])) }
    return newTickets
}

async function formatTickets(tickets){
    let newTickets = []
    for(let i = 0; i < tickets.length; i++){ newTickets.push(await formatTicket(tickets[i])) }
    return newTickets
}

async function formatTicket(ticket){
    return{
        id: ticket.id,
        eventId: ticket.evendid,
        ticketId: ticket.ticketid,
        receipt: ticket.receipt,
        buyerId: ticket.buyerid,
        buyerInfo: ticket.buyerinfo,
        ownerInfo: ticket.ownerinfo,
        date: ticket.date
    }
}

async function formatEvent(event){
    return{
        id: event.id,
        name: event.name,
        date: event.date,
        shortDescription: event.shortdescription,
        longDescription: event.longdescription,
        image: event.image,
        locationId: event.locationid,
        latitude: event.latitude,
        longitude: event.longitude,
        ticketsTableName: event.ticketstablename
    }
}

async function formatTag(tag){
    return{
        id: tag.id,
        tag: tag.tag
    }
}

async function formatTags(tags){
    let formattedTags = []
    for(let i = 0 ; i < tags.length; i++){ formattedTags.push(tags[i])}
    return formattedTags
}

async function formatSpeaker(speaker){
    return{
        name: speaker.name,
        id: speaker.id
    }
}

async function formatSpeakers(speakers){
    let newSpeakers = []
    for(let i = 0; i < speakers.length; i++){newSpeakers.push(await formatSpeaker(speakers[i]))}
    return newSpeakers
}


module.exports = {formatTicketType, formatTicketTypes, formatEvent, formatTicket, formatTickets,
                    formatTag, formatTags, formatSpeaker, formatSpeakers}
