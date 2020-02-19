insert into categories (name) values ('Business'), ('Athletes'), ('Education');

INSERT INTO countries(name) VALUES ('Iceland'), ('Niceland'), ('USA');

insert into cities (name, countryid) values('Reykjavík', 1), ('Ekki til', 2), ('Chicago', 3), ('Akureyri', 1), ('New York', 1);

insert into organizations (name) values ('ICPA'), ('ChiroPraktors');

INSERT INTO events (name, startdate, enddate,longdescription, cityid, startsellingtime, finishsellingtime, ticketstablename, categoryid, organizationid, cecredits) VALUES 
('TEST1', '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'Þetta er test', 1, '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'ticketssold_1', 1, 2,3), 
 ('TEST2', '2019-12-2T15:13:26.439Z', '2019-12-2T15:13:26.439Z', 'Þetta er test', 2, '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'tafla2', 3,1,3), 
 ('TEST2', '2019-12-2T15:13:26.439Z', '2019-12-2T15:13:26.439Z', 'Þetta er test', 1, '2019-12-18T15:13:26.439Z', '2019-12-18T15:13:26.439Z', 'tafla3', 3,1,3);

drop table if EXISTS ticketssold_1;
create table ticketssold_1(
     id serial PRIMARY key,
     name varchar(255),
     eventid integer not null,
     tickettypeid integer not null,
     price numeric(15,6) CHECK (price >= 0) NOT null,
     issold boolean not null default false,
     isbuying boolean not null default false,
     buyerid text not null,
     buyerinfo jsonb not null default '{}',
     ownerinfo jsonb default '{}',
     orderid TEXT,
     DATE timestamptz NOT NULL DEFAULT current_timestamp
);

insert into speakers (name, image) values ('Þórður Ágústsson', 'https://scontent.frkv3-1.fna.fbcdn.net/v/t31.0-1/c0.0.60.60a/p60x60/10658710_10201503392705500_1739679584724004174_o.jpg?_nc_cat=104&_nc_ohc=OoqBFquZEwEAQl6tJ0zL4zpfi-wzbFRUXDiGZKubGfZm_s-jmi2fK1KMQ&_nc_ht=scontent.frkv3-1.fna&oh=44c64fd729d2918f060b04a4bf98c26b&oe=5EAF1CF8'),
 ('Róbert Ingi Huldarsson', 'https://scontent.frkv3-1.fna.fbcdn.net/v/t31.0-1/c0.8.60.60a/p60x60/14289933_1171408029549142_3744193122298237561_o.jpg?_nc_cat=104&_nc_ohc=MjoYJnORmqsAQnFqjVwM53vxwezDpTeAlHtJk4b7z31tcaBfchIvATzyA&_nc_ht=scontent.frkv3-1.fna&oh=32e16084d53dd8e48a8872203ec1fa6d&oe=5E6B8FFF'), 
 ('Vignir Þór Bollason','https://scontent.frkv3-1.fna.fbcdn.net/v/t1.0-1/p60x60/68633267_10221008642586189_9050091452448636928_o.jpg?_nc_cat=110&_nc_ohc=8GZNPx1hfdMAQkO9UyJHnOgyUfXY71rF7YAd1kTFW1FPoyriVr_9p_8Tw&_nc_ht=scontent.frkv3-1.fna&oh=a4dac3aa6b534d38219c84c0dafdefe9&oe=5EABE798');

insert into speakersconnect (eventid, speakerid) values (1,1), (1,2), (2,3), (3,1);

insert into tags (name) values('Trigger Points'), ('Babies'), ('Hands on'), ('Þetta á ekki að sjást því það er ekki tengt neinu eventi');

insert into tagsconnect (eventid, tagid) values (1,1), (2,1), (1,3);

insert into tickets (name, price, amount, eventid, ownerinfo) values ('ChiroPractor', 333.333, 300, 1, array['{"label":"name", "type":"input", "required":true}', '{"label":"Massi", "type":"input", "required":true}']::jsonb[]), ('Helper', 200.01, 100, 1, array['{"label":"name", "type":"input", "required":true}', '{"label":"Massi", "type":"input", "required":true}']::jsonb[]), ('nobody', 1000.00, 100, 2, array['{"label":"name", "type":"input", "required":true}', '{"label":"Massi", "type":"input", "required":true}']::jsonb[]), ('Basic', 99.99, 33, 3, array['{"label":"name", "type":"input", "required":true}', '{"label":"Massi", "type":"input", "required":true}']::jsonb[]);

insert into organizations (name) values ('Best organization');

insert into orders(orderid, eventid, ordernr) values ('6782a7e2d27cd1bcf7ae396b604926d298409d00608c1066b5146d8e8208b207b66a0fc182a1606e', 1, 200);

insert into chirotixsettings (insurancepercentage, ticketstermstitle, ticketstermstext, receiptinfo) values(0.05, 'Tickets terms', "
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Mattis enim ut tellus elementum sagittis vitae et leo duis. Mollis nunc sed id semper risus. Volutpat odio facilisis mauris sit amet massa vitae tortor. Elementum eu facilisis sed odio morbi. Integer vitae justo eget magna. Mauris ultrices eros in cursus. Semper viverra nam libero justo laoreet sit amet cursus. Venenatis lectus magna fringilla urna. Dui sapien eget mi proin sed libero enim.

Enim ut tellus elementum sagittis. Enim nulla aliquet porttitor lacus luctus accumsan tortor posuere ac. Hac habitasse platea dictumst quisque sagittis purus sit amet. Lectus proin nibh nisl condimentum id venenatis a. Tortor pretium viverra suspendisse potenti nullam ac. Viverra ipsum nunc aliquet bibendum enim facilisis gravida neque. Praesent elementum facilisis leo vel fringilla est ullamcorper eget. Gravida cum sociis natoque penatibus et. Eget sit amet tellus cras. Dolor sed viverra ipsum nunc aliquet. Massa tincidunt nunc pulvinar sapien et ligula ullamcorper malesuada. Tortor condimentum lacinia quis vel eros donec. Sed id semper risus in hendrerit gravida rutrum quisque non. Pellentesque elit eget gravida cum sociis natoque penatibus. Lectus quam id leo in vitae turpis massa.

Mattis rhoncus urna neque viverra. Tellus integer feugiat scelerisque varius morbi enim. Habitant morbi tristique senectus et netus et malesuada. Pellentesque habitant morbi tristique senectus et netus et. Ut tristique et egestas quis ipsum. In massa tempor nec feugiat nisl pretium fusce id velit. Aliquam malesuada bibendum arcu vitae elementum curabitur vitae. Ut etiam sit amet nisl purus in mollis. Vel turpis nunc eget lorem dolor sed viverra ipsum. Egestas integer eget aliquet nibh praesent tristique. Odio morbi quis commodo odio aenean.

", array['{"companyName": "ChiroTix", "kennitala": "240697-3789", "location": "Álfaberg 24", "place": "221, Hafnarfjörður"}']::jsonb[]);

