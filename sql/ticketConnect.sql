CREATE TABLE ticketsconnect (
        id serial PRIMARY key,
        eventid integer references events(id),
        ticketid integer references tickets(id),
        DATE timestamptz NOT NULL DEFAULT current_timestamp
);