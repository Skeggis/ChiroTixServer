(
     id serial PRIMARY key,
     eventid integer not null,
     ticketid integer not null,
     receipt jsonb default '',
     issold boolean not null default false,
     buyerid text,
     buyerinfo jsonb default '',
     ownerinfo jsonb not null,
     DATE timestamptz NOT NULL DEFAULT current_timestamp
);