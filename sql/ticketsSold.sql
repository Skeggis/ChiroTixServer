(
     id serial PRIMARY key,
     eventid integer not null,
     ticketid integer not null,
     receipt jsonb default '{}',
     issold boolean not null default false,
     buyerid text not null,
     buyerinfo jsonb not null default '{}',
     ownerinfo jsonb default '{}',
     DATE timestamptz NOT NULL DEFAULT current_timestamp
);