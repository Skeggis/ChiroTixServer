require('dotenv').config();
const express = require('express');
const passport = require('passport');
var cors = require('cors')

const {
  errorHandler,
  notFoundHandler
} = require('../helpers.js')


const eventRouter = require('../routers/eventRouter')
const tagsRouter = require('../routers/tagsRouter')
const ticketRouter = require('../routers/ticketRouter')
const searchRouter = require('../routers/searchRouter')
const orderRouter = require('../routers/orderRouter')
const userRouter = require('../routers/userRouter')
const adminRouter = require('../routers/adminRouter')


const server = express();
server.use(cors({origin: '*'})) //Set options to only allow our frontend


server.use(express.json());
require('../passport')(passport);
server.use(passport.initialize());

server.use(searchRouter)
server.use(eventRouter)
server.use(tagsRouter)
server.use(ticketRouter)
server.use(orderRouter)
server.use(userRouter)
server.use(adminRouter)
server.use(notFoundHandler)
server.use(errorHandler)

module.exports = server