CREATE TABLE tagsconnect (
        id serial PRIMARY key,
        eventid integer references events(id),
        tagid integer references tickets(id),
        DATE timestamptz NOT NULL DEFAULT current_timestamp
);