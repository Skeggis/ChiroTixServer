require('dotenv').config();
const express = require('express');
const {
  errorHandler,
  notFoundHandler
} = require('./js/helpers.js')

const eventRouter = require('./js/routers/eventRouter')


const app = express();

app.use(express.json());
app.use(eventRouter)
app.use(notFoundHandler)
app.use(errorHandler)



app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  next();
});


const {
  PORT: port = 5000,
  HOST: host = '127.0.0.1',
} = process.env;
app.listen(port, () => {
  if (host) {
    console.info(`Server running at http://${host}:${port}/`);
  }
});
