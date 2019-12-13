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

module.exports = {ticketTypeFormatter}