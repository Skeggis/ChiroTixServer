create table events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  date TIMESTAMP,
  shortdescription TEXT,
  longdescription TEXT,
  image VARCHAR(255),
  locationid INT REFERENCES locations(id),
  latitude DECIMAL,
  longitude DECIMAL,
  ticketstablename varchar(255)
);