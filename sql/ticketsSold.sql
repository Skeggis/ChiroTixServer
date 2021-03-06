(
     id serial PRIMARY key,
     name varchar(255),
     eventid integer not null,
     tickettypeid integer not null,
     price numeric(15,6) CHECK (price >= 0) NOT null,
     receipt jsonb default '{}',
     issold boolean not null default false,
     buyerid text not null,
     buyerinfo jsonb not null default '{}',
     ownerinfo jsonb default '{}',
     DATE timestamptz NOT NULL DEFAULT current_timestamp
);