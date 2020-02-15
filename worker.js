let throng = require('throng');
let Queue = require("bull");
const io = require('socket.io')
const ticketDb = require('./js/database/ticketDb')
const { sendReceiptMail } = require('./js/handlers/emailHandler')
const { createTicketsPDF } = require('./js/createPDFHTML/createPDF')

const WEBSITE_URL = process.env.WEBSITE_URL
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const workers = process.env.WEB_CONCURRENCY || 1;
const maxJobsPerWorker = 100;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function start() {
  console.log('worker start')
  let workQueue = new Queue('work', REDIS_URL)

  workQueue.process(maxJobsPerWorker, async (job) => {
    const data = job.data
    let progress = 0
    while (progress < 10) {
      await sleep(1000)
      progress += 1
      job.progress(progress)
      console.log(progress)
    }

    const result = await saveOrder(data.eventId, data.buyerId, data.tickets, data.buyerInfo, data.receipt, data.insurance, data.insurancePrice)
    console.log(result)

    return { result, socketId: data.socketId }
  })
}

async function saveOrder(eventId, buyerId, tickets, buyerInfo, receipt, insurance, insurancePrice){
  console.log('saveorder')
  const buyingTicketsResponse = await ticketDb.buyTickets(eventId, buyerId, tickets, buyerInfo, receipt, insurance, insurancePrice)
  if (!buyingTicketsResponse.success) { return buyingTicketsResponse }
  console.log('her2')
  let createPDFResponse = await createTicketsPDF({ eventInfo: buyingTicketsResponse.eventInfo, tickets: buyingTicketsResponse.boughtTickets })
  let pdfBuffer;//TODO: handle if pdf creation fails.
  if (createPDFResponse.success) { pdfBuffer = createPDFResponse.buffer }
  console.log('her3')
  const orderId = buyingTicketsResponse.orderDetails.orderId
  await sendReceiptMail(
      `${WEBSITE_URL}/orders/${orderId}`,
      'noreply@chirotix.com',
      buyingTicketsResponse.orderDetails.buyerInfo.email,
      'ChiroTix order',
      pdfBuffer
  )
  console.log('emailSent')

  ticketDb.doneBuying(eventId, buyerId)//Change isBuying from true to false.

  return buyingTicketsResponse
}

throng({ workers, start })