const faker = require('faker')

async function generateNewBuyerInfo() {
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

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

async function generateNewEvent({speakers=false, organization=false, tickets=false, tags=false} = {}) {
    let startSellingTime = faker.date.past()
    let finishSellingTime = faker.date.between(new Date(), faker.date.future())
    let startDate = faker.date.between(finishSellingTime, (new Date(finishSellingTime)).addDays(faker.random.number(5)))
    let endDate = faker.date.between(startDate, (new Date(startDate)).addDays(faker.random.number(50)))
    return {
        name: faker.random.words(),
        startDate: startDate,
        endDate: endDate,
        shortDescription: faker.lorem.paragraph(),
        longDescription: faker.lorem.paragraphs(),
        image: faker.image.nature(),
        cityId: 1,
        category: 1,
        longitude: (faker.random.number({min: 0, max: 1, precision: 0.01})*100).toString(),
        latitude: (faker.random.number({min: 0, max: 1, precision: 0.01})*100).toString(),
        startSellingTime: startSellingTime,
        finishSellingTime: finishSellingTime,
        CECredits: faker.random.number(16),
        schedule: [
            { date: "2020-01-01", endTime: "2020-01-01T16:05:57.000Z", startTime: "2020-01-01T14:00:57.000Z" },
            { date: "2020-01-02", endTime: "2020-01-01T19:04:57.000Z", startTime: "2020-01-01T08:04:57.000Z" }],
        speakers: speakers || await generateNewSpeakers(faker.random.number(7)),
        organization: organization || await generateNewOrganization(),
        tickets: tickets || await generateNewTicketTypes(faker.random.number({min: 1, max:5})),
        tags: tags || TAGS_IDS
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

async function generateNewTicketTypes(amount, amounts = []){
    let ticketTypes = []
    for(let i = 0; i < amount; i++){
        ticketTypes.push({
             name: faker.commerce.productName(), 
             price: parseFloat(faker.commerce.price()), 
             amount: amounts[i] || faker.random.number(1000), 
             ownerInfo: [{ type: "input", label: "Name", required: true }] })
    }
    return ticketTypes
}

async function generateNewOrganization(){
    return {
        name: faker.company.companyName()
    }
}

const OLD_SPEAKERS = [{ id: 1 }, { id: 2 }, { id: 3 }]

const OLD_ORGANIZATIONS = [{ id: 1 }, { id: 2 }, { id: 3 }]

const TAGS_IDS = [1, 2, 3]

const RECEIPT = {}


module.exports = {
    OLD_SPEAKERS,
    OLD_ORGANIZATIONS,
    TAGS_IDS,
    RECEIPT,

    generateNewBuyerInfo,
    generateNewEvent,
    generateNewOrganizations,
    generateNewSpeakers,
    generateNewTicketTypes,
    generateNewOrganization
}