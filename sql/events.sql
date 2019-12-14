create table events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  date TIMESTAMPTZ,
  shortdescription TEXT,
  longdescription TEXT,
  image VARCHAR(255),
  locationid INT REFERENCES locations(id),
  latitude DECIMAL,
  longitude DECIMAL,
  ticketstablename varchar(255),
  startsellingtime TIMESTAMPTZ default current_timestamp
);