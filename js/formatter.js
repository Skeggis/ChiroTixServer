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
        ticketsTableName: event.ticketstablename,
    }
}

function formatSearchEvent(event){
    return {
        id: event.id,
        name: event.name,
        date: event.date,
        shortDescription: event.shortdescription,
        longDescription: event.longdescription,
        image: event.image,
        locationId: event.locationid,
        latitude: event.latitude,
        longitude: event.longitude,
        ticketsTableName: event.ticketstablename,
        organization: event.organization,
        country: event.country,
        city: event.city,
        speakers: event.speakers,
        tags: event.tags,
        eventId: event.eventid,
        organizationId: event.organizationId,
        countryId: event.countryId,
        cityId: event.cityId,
        startDate: event.startdate,
        endDate: event.endDate,
        minPrice: event.minprice,
        maxPrice: event.maxprice,
        tagsIds: event.tagsids,
        speakerIds: event.speakerids,
        CECredits: event.cecredits,
        categoryId: event.categoryid,
        featuredNr: event.featurednr,
        textSearchableIndexCol: event.textsearchable_index_col,
        image: event.image,
        shortDescription: event.shortdescription
    }
}

function formatSearchEvents(events){
    let newEvents = []
    events.map(event => newEvents.push(event))
    return newEvents
}

async function formatEvents(events){
    let newEvents = []
    for(let i = 0; i < events.length; i++){ newEvents.push(formatEvent(events[i])) }
    return newEvents
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


module.exports = {formatTicketType, formatTicketTypes, formatEvent, formatEvents, formatTicket, formatTickets,
                    formatTag, formatTags, formatSpeaker, formatSpeakers, formatSearchEvent, formatSearchEvents}
