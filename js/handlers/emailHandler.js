const nodemailer = require('nodemailer');
const {createReceiptEmail} = require('../emails/receiptEmail')
const config = {
  mailserver: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'carroll.erdman@ethereal.email',
      pass: 'y2jnQMBHpMacRdkAM9'
    }
  },

};

async function sendReceiptMail(link, from, to, subject) {
  // create a nodemailer transporter using smtp
  let transporter = nodemailer.createTransport(config.mailserver);

  const mail = {
    from: from,
    to: to,
    subject: subject,
    html: createReceiptEmail(link),
    // attatchments ---PDF
  }

  // send mail using transporter
  let info = await transporter.sendMail(mail);

  console.log(`Preview: ${nodemailer.getTestMessageUrl(info)}`);
};

module.exports={sendReceiptMail}

//sendReceiptMail().catch(console.error);