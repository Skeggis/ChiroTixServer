require('dotenv').config();
const socket = require('socket.io');
const ticketHandler = require('./handlers/ticketHandler')

async function connectSocket(server, app) {
    console.log("HERE")

    const io = socket(server,{
        pingTimeout: 5000,
      });
      app.set('io', io)
    //Setting up a socket with the namespace "connection" for new sockets
io.on("connection", async socket => {
    console.log("New client connected", socket.handshake.query);
    socket.buyerId = socket.handshake.query.buyerId
    socket.eventId = socket.handshake.query.eventId
    console.log(socket.eventId)
    console.log("ID:", socket.id)
    if(!(socket.buyerId && socket.eventId)){
        console.log("DISCONNECT")
        return socket.disconnect()
    }
    console.log("EMIT")
socket.emit('bro', {br:"bró"})

socket.on('timer', async (data) => {
    // console.log(data, "Received")

    console.log("TheData:", socket.timer)
    clearTimeout(socket.timeOut)
    //Will this work or will heroku throw it out on reconnect?
    socket.timeOut = setTimeout(async () => {
        console.log("TooLong!")
        console.log("HO", socket.buyerId, socket.eventId)
        await ticketHandler.releaseAllTicketsForBuyer({buyerId:socket.buyerId, eventId:socket.eventId})
        socket.emit('timerDone')
    }, socket.timer)
})

    //A special namespace "disconnect" for when a client disconnects
    socket.on("disconnect", async () => {
        clearTimeout(socket.timeOut)
        await ticketHandler.releaseAllTicketsForBuyer({buyerId:socket.buyerId, eventId:socket.eventId})
        console.log("Client disconnected")});
});

}

module.exports = { connectSocket }