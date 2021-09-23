require('dotenv').config();
const socket = require('socket.io');
const ticketHandler = require('./handlers/ticketHandler')

async function connectSocket(server, app) {

    const io = socket(server, { pingTimeout: 5000 });
    app.set('io', io)

    io.on("connection", async socket => {
        console.log("CONNECTED!", socket.id)
        socket.buyerId = socket.handshake.query.buyerId
        socket.eventId = socket.handshake.query.eventId

        if (!(socket.buyerId && socket.eventId)) { return socket.disconnect() }

        socket.on('timer', async () => {
            clearTimeout(socket.timeOut)

            //Will this work or will heroku throw it out on reconnect?
            socket.timeOut = setTimeout(async () => {
                let response = await ticketHandler.releaseAllTicketsForBuyer({ buyerId: socket.buyerId, eventId: socket.eventId })
                if(response.success){socket.emit('timerDone')}
            }, socket.timer)
        })

        socket.on("disconnect", async () => {
            console.log("DISCONNECT:", socket.id)
            clearTimeout(socket.timeOut)
            await ticketHandler.releaseAllTicketsForBuyer({ buyerId: socket.buyerId, eventId: socket.eventId })
        });

    });

}

module.exports = { connectSocket }