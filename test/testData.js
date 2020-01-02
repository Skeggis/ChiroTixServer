const NORMAL_EVENT = {
    name: "ChiroPraktik 101",
    startDate: '2020-01-01T21:28:53.897Z',
    endDate: '2020-01-02T21:28:53.897Z',
    shortDescription: 'Just an event for everybody, boyo.',
    longDescription: 'Just an event for everybody, boyo. And the description is longer. More details.',
    image: 'https://i.udemycdn.com/course/480x270/2328040_bbfb.jpg',
    cityId: 1,
    longitude: 13,
    latitude: 13,
    category: 1,
    startSellingTime: '2020-01-01T21:28:53.897Z',
    finishSellingTime: '2020-01-13T21:28:53.897Z',
    CECredits: 6,
    schedule: [
        {date: "2020-01-01", endTime: "2020-01-01T16:05:57.000Z", startTime: "2020-01-01T14:00:57.000Z"},
        {date: "2020-01-02", endTime: "2020-01-01T19:04:57.000Z", startTime: "2020-01-01T08:04:57.000Z"}]
  }

  const NEW_SPEAKERS = [{name:"Þórður newBoy"}, {name:"Róbert newBoy"}, {name:"Vignir newBoy"}]
  const OLD_SPEAKERS = [{name:"Þórður oldBoy", id:1}, {id:2}, {id:3}]

  const NEW_ORGANIZATIONS = [{name:"ICPA new"}, {name:"First Order"},{name:"The New Republic"}]
  const OLD_ORGANIZATIONS = [{name:"", id:1}, {id:2}, {id:3 }]

  const TAGS_IDS = [1,2,3]

  const TICKET_TYPES = [
      {name:"Chiropraktor, DC", price:100.0, amount:10, ownerInfo: [{type:"input", label:"Name", required:true}]},
      {name:"Helper", price:50.0, amount:10, ownerInfo: [{type:"input", label:"Name", required:true}]}
    ]


module.exports = {
    NORMAL_EVENT,
    NEW_SPEAKERS,
    OLD_SPEAKERS,
    NEW_ORGANIZATIONS,
    OLD_ORGANIZATIONS,
    TAGS_IDS,
    TICKET_TYPES
}