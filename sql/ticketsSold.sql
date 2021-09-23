(
     id serial PRIMARY key,
     name varchar(255),
     eventid integer references events(id),
     tickettypeid integer references tickets(id),
     price numeric(15,6) CHECK (price >= 0) NOT null,
     issold boolean not null default false,
     isbuying boolean not null default false,
     buyerid text not null,
     buyerinfo jsonb not null default '{}',
     ownerinfo jsonb default '{}',
     orderid TEXT,
     termstitle varchar(255),
     termstext text,
     DATE timestamptz NOT NULL DEFAULT current_timestamp
);