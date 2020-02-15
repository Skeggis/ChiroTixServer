require('dotenv').config();
const express = require('express');
const passport = require('passport');
var cors = require('cors')

const {connectSocket} = require('./js/socket')
const {
  errorHandler,
  notFoundHandler
} = require('./js/helpers.js')

let Queue = require('bull');
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const workQueue = new Queue('work', REDIS_URL);


const eventRouter = require('./js/routers/eventRouter')
const tagsRouter = require('./js/routers/tagsRouter')
const ticketRouter = require('./js/routers/ticketRouter')
const searchRouter = require('./js/routers/searchRouter')
const orderRouter = require('./js/routers/orderRouter')
const userRouter = require('./js/routers/userRouter')
const adminRouter = require('./js/routers/adminRouter')


const app = express();
app.use(cors()) //Set options to only allow our frontend


app.use(express.json());
require('./js/passport')(passport);
app.use(passport.initialize());

app.use(searchRouter)
app.use(eventRouter)
app.use(tagsRouter)
app.use(ticketRouter)
app.use(orderRouter)
app.use(userRouter)
app.use(adminRouter)
app.use(notFoundHandler)
app.use(errorHandler)



app.set('workQueue', workQueue)


const {
  PORT: port = 5000,
  HOST: host = '127.0.0.1',
} = process.env;
let server = app.listen(port, () => {
  if (host) {
    console.info(`Server running at http://${host}:${port}/`);
  }
});


connectSocket(server, app)

workQueue.on('global:completed', (jobId, result) => {
  const io = app.get('io')
  const jsonResult = JSON.parse(result)
  const socket = io.sockets.connected[jsonResult.socketId]
  socket.emit('paymentProcessed', jsonResult.result)
});

