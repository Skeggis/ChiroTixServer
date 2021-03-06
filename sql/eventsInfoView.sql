CREATE OR replace view eventsinfo AS 
    SELECT events.id AS eventid,
    events.name AS eventname,
    events.startdate AS startdate,
    events.enddate AS enddate,
    events.ownerinfo AS ownerinfo,
    events.longdescription as longdescription,
    events.image as image,
    events.latitude as latitude,
    events.longitude as longitude,
    events.cecredits as cecredits,

    organizations.name AS organization,
    countries.name AS country,
    cities.name AS city,

    tickets.id AS tickettypeid,
    tickets.price AS ticketprice,
    tickets.name AS ticketname

FROM events
    INNER JOIN tickets ON tickets.eventid=events.id
    INNER JOIN cities ON events.cityid = cities.id
    INNER JOIN countries ON cities.countryid = countries.id
    INNER JOIN organizations ON organizations.id = events.organizationid;