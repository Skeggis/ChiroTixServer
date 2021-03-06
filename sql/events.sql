create table events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  startdate TIMESTAMPTZ,
  enddate TIMESTAMPTZ,
  shortdescription TEXT,
  longdescription TEXT,
  image VARCHAR(255),
  cityid INT REFERENCES cities(id),
  categoryid Int REFERENCES categories(id),
  organizationid Int references organizations(id),
  latitude DECIMAL,
  longitude DECIMAL,
  ticketstablename varchar(255),
  startsellingtime TIMESTAMPTZ,
  finishsellingtime TIMESTAMPTZ,
  cecredits Int,
  ownerinfo JSONB[], --The info necessery for the buyer to insert for each ticket bought (for each owner of a ticket he buys)
  insertDate TIMESTAMPTZ default current_timestamp
);

-- CREATE view searchevents AS
--         SELECT ev.id AS eventid,
--         ev.name AS eventname,
--         ev.longdescription AS longdescription,
--         ev.startdate AS startdate,
--         ev.enddate AS enddate,
--         ev.cecredits AS cecredits,
--         ev.cityid AS cityid,
--         ev.countryid AS countryid,
        
--     FROM events AS ev;
-- UPDATE events SET name='Massi' WHERE id = 1;
-- DROP view eventsearch;