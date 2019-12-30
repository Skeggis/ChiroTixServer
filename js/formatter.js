async function formatTicketType(ticket){
    return {
        id: ticket.id,
        price: parseFloat(ticket.price).toFixed(2),
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
        eventId: ticket.eventid,
        name: ticket.name,
        ticketTypeId: ticket.tickettypeid,
        receipt: ticket.receipt,
        price: parseFloat(ticket.price).toFixed(2),
        buyerId: ticket.buyerid,
        buyerInfo: ticket.buyerinfo,
        ownerInfo: ticket.ownerinfo,
        date: ticket.date,
        termsTitle: ticket.termstitle,
        termsText: ticket.termstext
    }
}

async function formatEvent(event){
    return{
        id: event.id,
        name: event.name,
        startDate: event.startdate,
        endDate: event.enddate,
        dateRange: getDateRange(event.startdate, event.enddate),
        shortDescription: event.shortdescription,
        longDescription: event.longdescription,
        image: event.image,
        countryId: event.countryid,
        cityId: event.cityid,
        organizationId: event.organizationid,
        latitude: event.latitude,
        longitude: event.longitude,
        ticketsTableName: event.ticketstablename,
        ownerInfo: event.ownerinfo
    }
}

async function formatEventInfoView(rows){
    let eventInfo = {
        id: rows[0].eventid,
        name: rows[0].eventname,
        startDate: rows[0].startdate,
        endDate: rows[0].enddate,
        dateRange: getDateRange(rows[0].startdate, rows[0].enddate),
        country: rows[0].country,
        city: rows[0].city,
        organization: rows[0].organization,
        longDescription: rows[0].longdescription,
        image: rows[0].image,
        latitude: rows[0].latitude,
        longitude: rows[0].longitude,
        CECredits: rows[0].cecredits,
        ticketsTableName: rows[0].ticketstablename
    }

    let {dates, newSchedule} = await formatSchedule(rows[0].schedule)
    eventInfo.schedule = newSchedule
    eventInfo.dates = dates

    let ticketTypes = []
    let lowPrice = Infinity
    let maxPrice = 0
    for(let i = 0; i < rows.length; i++){
        ticketTypes.push({
            id: rows[i].tickettypeid,
            price: parseFloat(rows[i].ticketprice).toFixed(2),
            name: rows[i].ticketname,
            amount: 0,
            ownerInfo: rows[i].ownerinfo
        }) 
        if(rows[i].ticketprice < lowPrice){lowPrice = rows[i].ticketprice}
        if(rows[i].ticketprice > maxPrice){maxPrice = rows[i].ticketprice}
    }



    eventInfo.priceRange = lowPrice === maxPrice ? `${parseFloat(lowPrice).toFixed(2)} $` : `${parseFloat(lowPrice).toFixed(2)} - ${parseFloat(maxPrice).toFixed(2)} $`

    return {eventInfo, ticketTypes}
}

function getDateRange(startDate, endDate){
    let start = new Date(startDate)
    let end = new Date(endDate)

    if(start.getDate() === end.getDate() && start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()){
        return `${start.getDate()}.${start.getMonth()+1}.${start.getFullYear()%100}`
    }
    return `${start.getDate()}.${start.getMonth()+1}.${start.getFullYear()%100} - ${end.getDate()}.${end.getMonth()+1}.${end.getFullYear()%100}`
}

function formatSearchEvent(event){
    return {
        id: event.eventid,
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
        organizationId: event.organizationId,
        countryId: event.countryId,
        cityId: event.cityId,
        startDate: event.startdate,
        endDate: event.endDate,
        minPrice: parseFloat(event.minprice).toFixed(2),
        maxPrice: parseFloat(event.maxprice).toFixed(2),
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
    events.map(event => newEvents.push(formatSearchEvent(event)))
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

function formatOrderDetails(details){
    return {
        orderId: details.orderid,
        eventId: details.eventid,
        receipt: details.receipt,
        tickets: details.tickets,
        insurance: details.insurance,
        insurancePrice: parseFloat(details.insuranceprice).toFixed(2),
        buyerInfo: details.buyerinfo,
        buyerId: details.buyerid,
        date: details.date
    }
}

/**
 * @param {array} schedule: [{
 *          date: 'YYYY-MM-DD',
 *          startTime: 'YYYY-MM-DDTHH:MM:SS.000Z',
 *          endTime: 'YYYY-MM-DDTHH:MM:SS.000Z'
 * }]
 */
async function formatSchedule(schedule){
    var days = ['Sun','Mon','Tue','Wed','Thur','Fri','Sat'];
    var months = ['Jan','Feb','March','April','May','June','July','Aug','Sept','Oct','Nov','Dec'];
    let newSchedule = []
    let dates = ""

    if(!schedule || schedule.length === 0){return {dates, newSchedule}}
  
    let firstDate = new Date(schedule[0].date)
    if(schedule.length > 1){
      let lastDate = new Date(schedule[schedule.length-1].date)
      if(firstDate.getFullYear() !== lastDate.getFullYear()){
        if(firstDate.getMonth() !== lastDate.getMonth()){ 
          dates = `${months[firstDate.getMonth()]} ${firstDate.getDate()}, ${firstDate.getFullYear()} - ${months[lastDate.getMonth()]} ${lastDate.getDate()}, ${lastDate.getFullYear()}`
        } else { dates = `${months[firstDate.getMonth()]} ${firstDate.getDate()}, ${firstDate.getFullYear()} - ${lastDate.getDate()}, ${lastDate.getFullYear()}` }
      } else {
        if(firstDate.getMonth() !== lastDate.getMonth()){ 
          dates = `${months[firstDate.getMonth()]} ${firstDate.getDate()} - ${months[lastDate.getMonth()]} ${lastDate.getDate()}, ${firstDate.getFullYear()}`
        } else { dates = `${months[firstDate.getMonth()]} ${firstDate.getDate()} - ${lastDate.getDate()}, ${firstDate.getFullYear()}` }
      }
    } else { 
      dates = `${months[firstDate.getMonth()]} ${firstDate.getDate()}, ${firstDate.getDate()}`
    }
  
    for(let i = 0; i < schedule.length; i++){
      let day = new Date(schedule[i].date)
      day = days[day.getDay()]
      let startTime = new Date(schedule[i].startTime)
      let endTime = new Date(schedule[i].endTime)
      startTime = startTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      endTime = endTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      newSchedule.push(`${day} ${startTime} - ${endTime}`)
    }
  
    return {dates, newSchedule}
  }

  async function formatChiroTixSettings(settings){
      return {
          id: settings.id,
          ticketsTermsTitle: settings.ticketstermstitle,
          ticketsTermsText: settings.ticketstermstext
      }
  }

  async function formatUser(user){
      return {
          key: user.key,
          admin: user.admin,
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          dateRegistered: user.dateregistered
      }
  }

  async function formatUsers(users){
      let formattedUsers = []
      for(let i = 0; i < users.length; i++){ formattedUsers.push(await formatUser(users[i]))}
      return formattedUsers
  }
module.exports = {
    formatTicketType, 
    formatTicketTypes, 
    formatEvent, 
    formatEvents, 
    formatTicket, 
    formatTickets,
    formatTag, 
    formatTags, 
    formatSpeaker, 
    formatSpeakers, 
    formatSearchEvent, 
    formatSearchEvents,
    formatEventInfoView,
    formatOrderDetails,
    formatSchedule,
    formatChiroTixSettings,
    formatUser,
    formatUsers
}
