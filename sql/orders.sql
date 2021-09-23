create table orders(
  id serial primary key,
  orderid TEXT not null,
  eventid integer not null,
  receipt jsonb default '{}',
  tickets jsonb default '{}',
  insurance boolean,
  insuranceprice decimal,
  buyerinfo jsonb default '{}',
  buyerid text,
  ordernr integer unique,
  paymentmethod varchar(255),
  date timestamptz not null default current_timestamp
);