require('dotenv').config();
const express = require('express');
const {connectSocket} = require('./js/socket')
const {
  errorHandler,
  notFoundHandler
} = require('./js/helpers.js')

const cors = require('cors')

const eventRouter = require('./js/routers/eventRouter')
const tagsRouter = require('./js/routers/tagsRouter')
const ticketRouter = require('./js/routers/ticketRouter')
const searchRouter = require('./js/routers/searchRouter')


const app = express();

app.use(cors()) 

app.use(express.json());
app.use(searchRouter)
app.use(eventRouter)
app.use(tagsRouter)
app.use(ticketRouter)
app.use(notFoundHandler)
app.use(errorHandler)


// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept, Authorization',
//   );
//   next();
// });


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


