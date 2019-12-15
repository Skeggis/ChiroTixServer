async function ticketTypeFormatter(ticket){
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

module.exports = {ticketTypeFormatter, formatSpeaker, formatSpeakers}