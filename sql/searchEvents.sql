create table searchevents (
    id serial primary key,
    name varchar(255),
    description text,
    organization varchar(255),
    country varchar(255),
    city varchar(255),
    speakers varchar(255)[],
    tags varchar(255)[],
    eventid integer references events(id),
    organizationid integer references organizations(id),
    countryid integer references countries(id),
    cityid integer references cities(id),
    startdate TIMESTAMPtz,
    enddate timestamptz,
    finishsellingtime timestamptz,
    startsellingtime timestamptz,

    isselling boolean default true,
    isvisible boolean default true,
    issoldout boolean default false,
    
    minprice numeric(15,6),
    maxprice numeric(15,6),
    tagsids integer[],
    speakersids integer[],
    cecredits integer,
    categoryid integer references categories(id),
    featurednr integer default 0, --The lower the number the higher likelihood the event will be on the HomePage--
    textsearchable_index_col tsvector,
    image TEXT,
    shortdescription TEXT
);

-- textsearchable_index_col = ( setweight(to_tsvector('english',name), 'A')  ||  
--                              setweight(to_tsvector('english', description), 'C') ||
--                              setweight(to_tsvector('english', organization), 'B') ||
--                              setweight(to_tsvector('english', country), 'B') ||
--                              setweight(to_tsvector('english', array_to_string(speakers, ' ')), 'B') ||
--                              setweight(to_tsvector('english', city), 'B') ||
--                              setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B')
--                              );