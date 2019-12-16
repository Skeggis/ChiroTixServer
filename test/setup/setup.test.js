require('dotenv').config()
const db = require('../../js/database/db')
const fs = require('fs');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const formatter = require('../../js/formatter')

const {
    TICKETS_TYPE_DB,
    EVENTS_DB,
    TAGS_DB,
    LOCATIONS_DB,
    SPEAKERS_DB,
    SPEAKERS_CONNECT_DB,
    TAGS_CONNECT_DB
} = process.env;

describe('Setup test environment', async () => {
    global.ticketsSoldTableName = "ticketssold_1"
    global.tickets = []
    global.event = {}
    global.buyerId = "mklsjid9238140"
    global.otherBuyerId = "Neeeeetttiiii"
    global.buyerInfo = {
        name: "Þórður",
        email: "tannbursti@gmail.com"
    }
    global.otherBuyerInfo = {
        name: "Róbert",
        email: "strokleður@gmail.com"
    }

    it('should delete from all tables', async () => {
        await db.query(`delete from ${SPEAKERS_CONNECT_DB}`)
        await db.query(`delete from ${SPEAKERS_DB}`)

        query = `delete from ${TICKETS_TYPE_DB}`
        await db.query(query)

        query = `delete from ${EVENTS_DB}`
        await db.query(query)

        await db.query(`DROP TABLE IF EXISTS ${global.ticketsSoldTableName}`);

        await db.query(`delete from ${TAGS_DB}`)

        await db.query(`delete from ${TAGS_CONNECT_DB}`)

        await db.query(`delete from ${LOCATIONS_DB}`)


    })

    it('should create ticketsSold table', async () => {
        const ticketsTableTemplate = await readFileAsync('./sql/ticketsSold.sql');
        let query = `create table ${global.ticketsSoldTableName} ${ticketsTableTemplate}`
        await db.query(query)
    })

    it('should insert rows', async () => {
        query = `insert into ${EVENTS_DB} (name, ticketstablename) values('Test', '${global.ticketsSoldTableName}') returning *`
        let result = await db.query(query)
        global.event = await formatter.formatEvent(result.rows[0])

        query = `insert into ${LOCATIONS_DB} (city, country) values ('Reykjavík', 'Iceland') returning *`
        result = await db.query(query);
        global.location = result.rows[0]

        query = `insert into ${TICKETS_TYPE_DB} (name, price, amount) values('Venjulegur', 333.333, 100) returning *`
        result = await db.query(query)
        global.tickets.push(result.rows[0])

        query = `insert into ${TICKETS_TYPE_DB} (name, price, amount) values('Óvenjulegur', 333.333, 9) returning *`
        result = await db.query(query)
        global.tickets.push(result.rows[0])
        
        query = `insert into ${TICKETS_TYPE_DB} (name, price, amount) values('Basic', 333.333, 100) returning *`
        result = await db.query(query)
        global.tickets.push(result.rows[0])

    })

}) 