const ticketDb = require('../database/ticketDb')
const searchDb = require('../database/searchDb')
const eventDb = require('../database/eventDb')
const formatter = require('../formatter')
const xlsx = require('xlsx')

async function changeTicketState(ticketTypeId){
    let ticket = await ticketDb.changeTicketState(ticketTypeId)
    if(!ticket){return null}
    return await formatter.formatTicketType(ticket)
}

async function changeEventState({eventId=-1, isSelling=true, isSoldOut=false, isVisible=true}){
    let response = await eventDb.changeEventState(eventId, isSelling, isSoldOut, isVisible)
    if(response.success && response.event){response.event = await formatter.formatSearchEvent(response.event)}
    return response
}

async function getEventsInfoWithTicketTypes() {
    let eventsMessage = await searchDb.getAllSearchableEvents()
    if (!eventsMessage || !eventsMessage.success) { return null }
    let events = []
    for (let i = 0; i < eventsMessage.events.length; i++) {
        let eventInfo = eventsMessage.events[i]
        events.push({
            eventInfo: eventInfo,
            ticketTypes: await ticketDb.getTicketTypesOfEvent(eventInfo.id)
        })
    }
    return events
}

async function getTicketsXLSheetFor(id) {
    let event = await eventDb.getEventByIdDb(id)
    let ticketsJSON = await ticketDb.getAllTicketsSoldIn(event.eventInfo.ticketsTableName)
    if (!ticketsJSON) { return null }
    let xlJSON = await formatter.formatTicketsForCustomer(ticketsJSON)
// console.log(xlJSON)
    var wb = xlsx.utils.book_new();
    /* make the worksheet */
    var ws = xlsx.utils.json_to_sheet(xlJSON);

    xlsx.utils.book_append_sheet(wb, ws, 'test');
    
    /* generate buffer */
	var buf = xlsx.write(wb, {type:'buffer', bookType:"xlsx"});

    return {buffer:buf, success:true}
}

module.exports = { getEventsInfoWithTicketTypes, getTicketsXLSheetFor, changeTicketState, changeEventState }