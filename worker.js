let throng = require('throng');
let Queue = require("bull");
const io = require('socket.io')
const ticketDb = require('./js/database/ticketDb')
const { sendReceiptMail } = require('./js/handlers/emailHandler')
const { createTicketsPDF } = require('./js/createPDFHTML/createPDF')
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const paypalClient = require('./js/paypalEnvironment')

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
console.log("THERE")
  workQueue.process(maxJobsPerWorker, async (job) => {
    const data = job.data
      //job.progress(progress)
    const paymentResult = await handlePayment(data.paymentOptions, data.insurance, data.tickets)
    console.log("MERE")
    if(!paymentResult.success){
        return {result: paymentResult, socketId: data.socketId}
    }
    console.log(job.ticketTypes)

    let receipt = {
      cardNumber: '7721',
      expiryDate: '03/22',
      amount: paymentResult.price,
      name: 'Róbert Ingi Huldarsson',
      address: 'Álfaberg 24',
      place: '221, Hafnarfjörður',
      country: 'Iceland',
      lines: data.ticketTypes
  }
console.log("SAVEIT")
    const result = await saveOrder(data.eventId, data.buyerId, data.tickets, data.buyerInfo, receipt, data.insurance, paymentResult.insurancePrice)
console.log("SAVED")
    return { result, socketId: data.socketId }
  })
}

async function saveOrder(eventId, buyerId, tickets, buyerInfo, receipt, insurance, insurancePrice){
  console.log('saveorder')
  const buyingTicketsResponse = await ticketDb.buyTickets(eventId, buyerId, tickets, buyerInfo, receipt, insurance, insurancePrice)
  if (!buyingTicketsResponse.success) { return buyingTicketsResponse }
  console.log('her2')
  let createPDFResponse = await createTicketsPDF({ eventInfo: buyingTicketsResponse.eventInfo, orderDetails:buyingTicketsResponse.orderDetails, chiroInfo: buyingTicketsResponse.chiroInfo })
  let pdfBuffer;//TODO: handle if pdf creation fails.
  if (createPDFResponse.success) { pdfBuffer = createPDFResponse.buffer }
  console.log('her3')
  const orderId = buyingTicketsResponse.orderDetails.orderId
  orderDetails.eventName = buyingTicketsResponse.eventInfo.name
  await sendReceiptMail(
      `${WEBSITE_URL}/orders/${orderId}`,
      'noreply@chirotix.com',
      buyingTicketsResponse.orderDetails.buyerInfo.email,
      'ChiroTix order',
      pdfBuffer,
      buyingTicketsResponse.orderDetails
  )
  console.log('emailSent')

  ticketDb.doneBuying(eventId, buyerId)//Change isBuying from true to false.

  return buyingTicketsResponse
}

async function handlePayment(paymentOptions, insurance, tickets) {
  console.log(paymentOptions.method)
  const price = await calculatePrice(tickets, insurance)
  console.log('price',price)
  if(paymentOptions.method === 'borgun'){
      return await handleBorgunPayment(price, paymentOptions.Token, insurance)  
  } else if (paymentOptions.method === 'paypal'){
    console.log('her')
      return handlePaypalPayment(price, paymentOptions.orderId, insurance)
  } else {
      return SYSTEM_ERROR
  }
}

async function calculatePrice(tickets, insurance) {
  const ticketsPrice = await ticketDb.getTicketsPrice(tickets)
  console.log(ticketsPrice)
  console.log('insurance', insurance)
  if (insurance) {
      const percentage = await ticketDb.getInsurancePercentage()
      console.log('per', percentage)
      const insurancePrice = (percentage * ticketsPrice).toFixed(2)
      console.log('ins', insurancePrice)
      const totalPrice = (parseFloat(insurancePrice) + ticketsPrice).toFixed(2)
      console.log('total', totalPrice)
      return {
          totalPrice: totalPrice,
          insurancePrice: insurancePrice
      }
  } else {
      return { totalPrice: ticketsPrice }
  }
}


/**
 * paymentOptions: {
 *      method: String ('borgun' || 'paypal')
 *      Token: String (only if method is borgun)
 *      orderId: String (only if method is paypal)
 * }
 * 
 */
async function handleBorgunPayment(price, Token, insurance){
  const orderId = crypto.randomBytes(6).toString('hex').toUpperCase()

  const borgunResult = await fetch('someapihere and private key', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
          TransactionType: 'Sale',
          Amount: price.totalPrice,
          Currency: '840', //usd
          TransactionDate: new Date().toISOString(),
          OrderId: orderId,
          PaymentMethod: {
              PaymentType: 'TokenSingle',
              Token: Token
          },
          Metadata: insurance ? {
              insurancePrice: price.insurancePrice
          } : {}
      })
  })

  const borgunData = await borgunResult.json()
}



async function handlePaypalPayment(price, orderId, insurance){
  console.log('inside handlepaypal')
  // 3. Call PayPal to get the transaction details
  let request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);

  let order
  try {
    order = await paypalClient.client().execute(request);
  } catch (err) {

    // 4. Handle any errors from the call
    console.error(err);
    return SYSTEM_ERROR
  }
  // 5. Validate the transaction details are as expected
  console.log(price)
  console.log(order.result.purchase_units[0].amount.value)
  if (order.result.purchase_units[0].amount.value !== parseFloat(price.totalPrice).toFixed(2)) {
    return BAD_REQUEST('You did not pay the expected amount')
  }

  // 6. Save the transaction in your database
  // await database.saveTransaction(orderID);

  // 7. Return a successful response to the client
  console.log('ekki villa i handlepaypal')
  return {success: true, price: order.result.purchase_units[0].amount.value, insurancePrice: price.insurancePrice};

}

throng({ workers, start })