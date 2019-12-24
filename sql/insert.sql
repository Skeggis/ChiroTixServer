insert into categories (name) values ('Business'), ('Athletes'), ('Education');

INSERT INTO countries(name) VALUES ('Iceland'), ('Niceland'), ('USA');

insert into cities (name, countryid) values('Reykjavík', 1), ('Ekki til', 2), ('Chicago', 3), ('Akureyri', 1), ('New York', 1);

insert into organizations (name) values ('ICPA'), ('ChiroPraktors');

INSERT INTO events (name, startdate, enddate,longdescription, cityid, startsellingtime, finishsellingtime, ticketstablename, categoryid, organizationid, ownerinfo, cecredits) VALUES 
('TEST1', '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'Þetta er test', 1, '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'ticketssold_1', 1, 2,array['{"label":"name", "type":"input", "required":true}', '{"label":"Massi", "type":"input", "required":true}']::jsonb[],3), 
 ('TEST2', '2019-12-2T15:13:26.439Z', '2019-12-2T15:13:26.439Z', 'Þetta er test', 2, '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'tafla2', 3,1,array['{"label":"name", "type":"input", "required":true}', '{"label":"Massi", "type":"input", "required":true}']::jsonb[],3), 
 ('TEST2', '2019-12-2T15:13:26.439Z', '2019-12-2T15:13:26.439Z', 'Þetta er test', 1, '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'tafla3', 3,1,array['{"label":"name", "type":"input", "required":true}', '{"label":"Massi", "type":"input", "required":true}']::jsonb[],3);

drop table if EXISTS ticketssold_1;
create table ticketssold_1(
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

insert into speakers (name, image) values ('Þórður Ágústsson', 'https://scontent.frkv3-1.fna.fbcdn.net/v/t31.0-1/c0.0.60.60a/p60x60/10658710_10201503392705500_1739679584724004174_o.jpg?_nc_cat=104&_nc_ohc=OoqBFquZEwEAQl6tJ0zL4zpfi-wzbFRUXDiGZKubGfZm_s-jmi2fK1KMQ&_nc_ht=scontent.frkv3-1.fna&oh=44c64fd729d2918f060b04a4bf98c26b&oe=5EAF1CF8'),
 ('Róbert Ingi Huldarsson', 'https://scontent.frkv3-1.fna.fbcdn.net/v/t31.0-1/c0.8.60.60a/p60x60/14289933_1171408029549142_3744193122298237561_o.jpg?_nc_cat=104&_nc_ohc=MjoYJnORmqsAQnFqjVwM53vxwezDpTeAlHtJk4b7z31tcaBfchIvATzyA&_nc_ht=scontent.frkv3-1.fna&oh=32e16084d53dd8e48a8872203ec1fa6d&oe=5E6B8FFF'), 
 ('Vignir Þór Bollason','https://scontent.frkv3-1.fna.fbcdn.net/v/t1.0-1/p60x60/68633267_10221008642586189_9050091452448636928_o.jpg?_nc_cat=110&_nc_ohc=8GZNPx1hfdMAQkO9UyJHnOgyUfXY71rF7YAd1kTFW1FPoyriVr_9p_8Tw&_nc_ht=scontent.frkv3-1.fna&oh=a4dac3aa6b534d38219c84c0dafdefe9&oe=5EABE798');

insert into speakersconnect (eventid, speakerid) values (1,1), (1,2), (2,3), (3,1);

insert into tags (name) values('Trigger Points'), ('Babies'), ('Hands on'), ('Þetta á ekki að sjást því það er ekki tengt neinu eventi');

insert into tagsconnect (eventid, tagid) values (1,1), (2,1), (1,3);

insert into tickets (name, price, amount, eventid) values ('ChiroPractor', 333.333, 300, 1), ('Helper', 200.01, 100, 1), ('nobody', 1000.00, 100, 2), ('Basic', 99.99, 33, 3);

insert into organizations (name) values ('Best organization');

