let crypto;
try {
  crypto = require('crypto');
  console.log("YEA")
  console.log(crypto.randomBytes(20).toString('Hex'))
} catch (err) {
  console.log('crypto support is disabled!');
}