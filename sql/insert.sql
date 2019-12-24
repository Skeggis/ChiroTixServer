insert into categories (name) values ('Business'), ('Athletes'), ('Education');

INSERT INTO countries(name) VALUES ('Iceland'), ('Niceland'), ('USA');

insert into cities (name, countryid) values('Reykjavík', 1), ('Ekki til', 2), ('Chicago', 3), ('Akureyri', 1), ('New York', 1);

INSERT INTO events (name, startdate, enddate,longdescription, cityid, startsellingtime, finishsellingtime, ticketstablename, categoryid) VALUES 
('TEST1', '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'Þetta er test', 1, '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'tafla1', 1), 
 ('TEST2', '2019-12-2T15:13:26.439Z', '2019-12-2T15:13:26.439Z', 'Þetta er test', 1, '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'tafla2', 3), 
 ('TEST2', '2019-12-2T15:13:26.439Z', '2019-12-2T15:13:26.439Z', 'Þetta er test', 1, '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'tafla3', 3);

insert into speakers (name) values ('Þórður Ágústsson'), ('Róbert Ingi Huldarsson'), ('Vignir Þór Bollason');

insert into speakersconnect (eventid, speakerid) values (1,1), (1,2), (2,3), (3,1);

insert into tags (name) values('Trigger Points'), ('Babies'), ('Hands on'), ('Þetta á ekki að sjást því það er ekki tengt neinu eventi');

insert into tagsconnect (eventid, tagid) values (1,1), (2,1), (1,3);

insert into tickets (name, price, amount, eventid) values ('ChiroPractor', 333.333, 300, 1), ('Helper', 200.01, 100, 1), ('nobody', 1000.00, 100, 2), ('Basic', 99.99, 33, 3);

insert into organizations (name) values ('Best organization');

