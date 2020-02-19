const puppeteer = require('puppeteer')
const fs = require('fs')
const util = require('util')
const hbs = require('handlebars')
const path = require('path')

const readAsync = util.promisify(fs.readFile)

const compile = async function (template, data){
  const filePath = path.join(__dirname, 'templates', `${template}.hbs`)
  const html = await readAsync(filePath, 'utf-8')
  return hbs.compile(html)(data)
}

/**
 * 
 * @param {*} data : {
 *            orderDetails: {
 *              tickets:[
 * {
 *                ownerInfo: [{
 *                  label: String,
 *                  value: String,
 *                  }
 *                ],
 *                name: String,
 *                price: double,
 *                id: Integer
 *              }
 * ],
 *              buyerInfo: {},
 *              orderNr: Integer
 * },
 * eventInfo:{
 *  *            name: String, (Event name),
 *            CECredits: Integer,
 *            organization: String,
 *            city: String,
 *            country: String,
 *            streetName: String,
 *            dates: String, (format: "Jan 3-7, 2020"),
 *            schedule: [String], (format: ["Fri: 10:00 AM - 4:30 PM", "Sat: 11:00 AM - 7:00 PM", ...])
 * 
 * },
 * chiroInfo: {
 * receiptInfo: {},
 * ticketTermsTitle: String,
 * ticketTermsText: String
 * }
 * }
 */
async function createTicketsPDF(data){
  console.log("CreateTickesPDF")
  let success = false
  let buffer;
  try{
    const browser = await puppeteer.launch()
    
    const page = await browser.newPage()
    await page.emulateMedia('screen')

      const content = await compile('ticketTemplate', {
        tickets: data.orderDetails.tickets,
        orderNr: data.orderDetails.orderNr,
        eventInfo: data.eventInfo,
        chiroInfo: data.chiroInfo
      })
    
      await page.setContent(content)
      await page.addStyleTag({path: __dirname + '/styles/ticketTemplate.css'})
      

      buffer = await page.pdf({
        path: __dirname + `/pdfs/orderNr-${data.orderDetails.orderNr}-tickets.pdf`,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true
      })

    await browser.close()
    success = true
  }
  catch(e){
    console.log(e)
  } finally{
    return {success, buffer}
  }
}

module.exports = {createTicketsPDF}
