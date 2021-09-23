create table events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  schedule jsonb[],
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
  insertDate TIMESTAMPTZ default current_timestamp,

  isselling boolean default true,
    isvisible boolean default true,
    issoldout boolean default false
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