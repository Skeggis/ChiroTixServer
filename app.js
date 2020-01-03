require('dotenv').config();
const express = require('express');
const passport = require('passport');
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


