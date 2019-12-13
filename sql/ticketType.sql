CREATE TABLE tickets (
        id serial PRIMARY key,
        price numeric(15,6) not null,
        name varchar(255) not null,
        amount integer not null,
        sold integer not null default 0,
        reserved integer not null default 0,
        DATE timestamptz NOT NULL DEFAULT current_timestamp
    );