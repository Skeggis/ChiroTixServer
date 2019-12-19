create table speakersconnect (
    id serial primary key,
    eventid integer references events(id),
    speakerid integer references speakers(id),
    insertDate timestamptz not null default current_timestamp
);