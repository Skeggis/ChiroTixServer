require('dotenv').config();

const app = require('./js/server')
const {connectSocket} = require('./js/socket')

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


