CREATE TABLE cities(
  id SERIAL PRIMARY KEY,
  city VARCHAR(255) unique,
  countryid Int references countries(id)
);