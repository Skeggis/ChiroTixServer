require('dotenv').config();
const express = require('express');
var cors = require('cors')

const {connectSocket} = require('./js/socket')
const {
  errorHandler,
  notFoundHandler
} = require('./js/helpers.js')


const eventRouter = require('./js/routers/eventRouter')
const tagsRouter = require('./js/routers/tagsRouter')
const ticketRouter = require('./js/routers/ticketRouter')
const searchRouter = require('./js/routers/searchRouter')
const orderRouter = require('./js/routers/orderRouter')


const app = express();
app.use(cors({origin: '*'})) //Set options to only allow our frontend


app.use(express.json());
app.use(searchRouter)
app.use(eventRouter)
app.use(tagsRouter)
app.use(ticketRouter)
app.use(orderRouter)
app.use(notFoundHandler)
app.use(errorHandler)




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


