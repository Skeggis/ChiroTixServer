const puppeteer = require('puppeteer')
const fs = require('fs')
const util = require('util')
const hbs = require('handlebars')
const path = require('path')
const data = require('./data.json')

const readAsync = util.promisify(fs.readFile)

const compile = async function (template, data){
  const filePath = path.join(__dirname, 'templates', `${template}.hbs`)
  const html = await readAsync(filePath, 'utf-8')
  return hbs.compile(html)(data)
}


async function test(){
  try{
    const browser = await puppeteer.launch()
    
    const page = await browser.newPage()
    const content = await compile('main', theData)
    
    await page.setContent(content)
    await page.addStyleTag({path: './public/ticketTemplate.css'})
    await page.emulateMedia('screen')
    await page.pdf({
      path: 'myPdf.pdf',
      format: 'A4',
      printBackground: true
    })

    console.log("done")
    await browser.close()
    process.exit()
  }
  catch(e){
    console.log(e)
  }
}

module.exports = {createPDF}