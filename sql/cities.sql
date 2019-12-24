CREATE TABLE cities(
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) unique,
  countryid Int references countries(id)
);