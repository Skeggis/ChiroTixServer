CREATE TABLE tickets (
        id serial PRIMARY key,
        price numeric(15,6) CHECK (price >= 0) NOT null,
        name varchar(255) NOT null,
        amount INTEGER CHECK (amount >= 0) NOT null,
        sold INTEGER CHECK (sold >= 0) NOT NULL DEFAULT 0,
        reserved INTEGER CHECK (reserved >= 0) NOT NULL DEFAULT 0,
        DATE timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        eventid integer references events(id),
        disabled boolean default false,
        ownerinfo JSONB[] --The info necessery for the buyer to insert for each ticket bought (for each owner of a ticket he buys)

    );