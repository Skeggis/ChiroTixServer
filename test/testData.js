const faker = require('faker')

async function generateBuyerInfo() {
    return {
        name: faker.name.findName(),
        email: faker.internet.email(),
        phone: faker.phone.phoneNumber(),
        address: faker.address.streetAddress(),
        country: faker.address.country(),
        city: faker.address.city(),
        state: faker.address.state(),
        zipCode: faker.address.zipCode()
    }
}

async function generateEvent() {
    return {
        name: faker.random.words(),
        startDate: '2020-01-01T21:28:53.897Z',
        endDate: '2020-01-02T21:28:53.897Z',
        shortDescription: faker.lorem.paragraph(),
        longDescription: faker.lorem.paragraphs(),
        image: faker.image.nature(),
        cityId: 1,
        longitude: 13,
        latitude: 13,
        category: 1,
        startSellingTime: '2020-01-01T21:28:53.897Z',
        finishSellingTime: '2020-01-13T21:28:53.897Z',
        CECredits: faker.random.number(16),
        schedule: [
            { date: "2020-01-01", endTime: "2020-01-01T16:05:57.000Z", startTime: "2020-01-01T14:00:57.000Z" },
            { date: "2020-01-02", endTime: "2020-01-01T19:04:57.000Z", startTime: "2020-01-01T08:04:57.000Z" }]
    }
}

async function generateNewSpeakers(amount) {
    let newSpeakers = []
    for (let i = 0; i < amount; i++) {
        newSpeakers.push({
            name: faker.name.findName().replace(/\'/g, "")
        })
    }
    return newSpeakers
}

async function generateNewOrganizations(amount) {
    let organizations = []
    for (let i = 0; i < amount; i++) {
        organizations.push({
            name: faker.company.companyName()
        })
    }
    return organizations
}

async function generateNewTicketTypes(amount){
    let ticketTypes = []
    for(let i = 0; i < amount; i++){
        ticketTypes.push({
             name: faker.commerce.productName(), 
             price: parseFloat(faker.commerce.price()), 
             amount: faker.random.number(1000), 
             ownerInfo: [{ type: "input", label: "Name", required: true }] })
    }
    return ticketTypes
}

const NORMAL_BUYER_INFO = generateBuyerInfo()

const NORMAL_EVENT = generateEvent()

const NEW_SPEAKERS = generateNewSpeakers(3)
const OLD_SPEAKERS = [{ id: 1 }, { id: 2 }, { id: 3 }]

const NEW_ORGANIZATIONS = [{
    name: faker.company.companyName()
},{
    name: faker.company.companyName()
}]
const OLD_ORGANIZATIONS = [{ id: 1 }, { id: 2 }, { id: 3 }]

const TAGS_IDS = [1, 2, 3]

const TICKET_TYPES = generateNewTicketTypes(2)

const RECEIPT = {}


module.exports = {
    NORMAL_EVENT,
    NEW_SPEAKERS,
    OLD_SPEAKERS,
    NEW_ORGANIZATIONS,
    OLD_ORGANIZATIONS,
    TAGS_IDS,
    TICKET_TYPES,
    NORMAL_BUYER_INFO,
    RECEIPT,

    generateBuyerInfo,
    generateEvent,
    generateNewOrganizations,
    generateNewSpeakers,
    generateNewTicketTypes
}