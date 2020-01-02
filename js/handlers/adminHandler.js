const { getTicketTypesOfEvent, getAllTicketsSoldIn } = require('../database/ticketDb')
const { search } = require('../database/searchDb')
const { getEventByIdDb } = require('../database/eventDb')
const formatter = require('../formatter')
const xlsx = require('xlsx')

async function getEventsInfoWithTicketTypes() {
    let eventsInfo = await search()
    if (!eventsInfo) { return null }
    let events = []
    for (let i = 0; i < eventsInfo.length; i++) {
        events.push({
            eventInfo: eventsInfo[i],
            ticketTypes: await getTicketTypesOfEvent(eventsInfo[i].id)
        })
    }
    return events
}

async function getTicketsXLSheetFor(id) {
    let event = await getEventByIdDb(id)
    let ticketsJSON = await getAllTicketsSoldIn(event.eventInfo.ticketsTableName)
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

module.exports = { getEventsInfoWithTicketTypes, getTicketsXLSheetFor }