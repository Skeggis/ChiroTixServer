create table chirotixsettings(
    id serial primary key,
    ticketstermstitle varchar(255),
    ticketstermstext text,
    receiptinfo jsonb[] default '{}',
    insurancepercentage decimal
);
