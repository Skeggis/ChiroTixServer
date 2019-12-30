CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 

CREATE TABLE users(
    key serial primary key,
    admin boolean not null default false,
    id uuid default uuid_generate_v4(),
    name varchar(255) NOT null,
    email varchar(255) NOT null,
    password text,
    dateregistered TIMESTAMPtz NOT NULL DEFAULT CURRENT_TIMESTAMP
);