

ÞÓRÐUR:
1. Insert/updates/delete in postgres should TRIGGER other tables (i.e. when updating/creating an event then the SearchEvents table should be inserted/updated!) 
    (or should they???)
2. Ranking of search i.e. what events come up first, how does the search match the events (who are the best match?). Perhaps only search with the 
    SearchString, date, price and just use the tags/etc. in the same way as the SearchString.???
3. Add coalesce to the query for the searchTable insert on the insertEvent func and updateEvent func. (http://www.postgresqltutorial.com/postgresql-coalesce/)