create table orders(
  id serial primary key,
  orderid TEXT not null,
  eventid integer not null,
  receipt jsonb default '{}',
  tickets jsonb default '{}',
  insurance boolean,
  insuranceprice integer,
  buyerinfo jsonb default '{}',
  buyerid text,
  date timestamptz not null default current_timestamp
);