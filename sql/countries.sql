CREATE TABLE countries(
  id SERIAL PRIMARY KEY,
  country VARCHAR(255) unique,
  city VARCHAR(255)
);