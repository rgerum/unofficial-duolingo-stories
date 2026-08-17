# Spanish story characters (canonical course `es-en`)

Generated 2026-08-17 from production data: course 12 (`es-en`), all 279 stories of the official Duolingo Spanish course that we use as the canonical source for translations.

**How this was built.** Speaker avatar ids were extracted from every story's markup. The 10 main-cast characters have fixed names/voices in the Spanish `avatar_mappings` (gender from the TTS voice's gender in `speakers`). All other characters were verified against the actual story text, because side-character avatars are reused across stories and their mapping names are often wrong for a given story (e.g. avatar 988 is mapped as "La Madre de Juan" but is Paula, the company director, in two stories). For characters that a story never names, gender was inferred from Spanish grammatical agreement and their name is a role description or the (unconfirmed) mapping name.

Notes:
- **Júnior** and **Sergio** are boys voiced by pitched-down female voices; listed as male here.
- **Eddy** exists under two avatar ids (414, and 504 in "The Dance Class").
- The Spanish avatar-mapping name disagrees with the story text in **33 appearances** — full list at the bottom; worth cleaning up in `avatar_mappings`.
- 8 characters have unknown gender (no grammatical clue in their lines).

## Main cast

| Character | Gender | Avatar id | Voice | Stories |
|---|---|---|---|---|
| Eddy | male | 414, 504 | es-ES-ArnauNeural | 92 |
| Júnior | male | 415 | es-MX-MarinaNeural | 69 |
| Bea | female | 507 | es-ES-LiaNeural | 66 |
| Lin | female | 508 | es-MX-DaliaNeural | 62 |
| Lili | female | 416 | es-CL-CatalinaNeural | 51 |
| Zari | female | 418 | es-BO-SofiaNeural | 49 |
| Lucía | female | 509 | es-NI-YolandaNeural(pitch=x-low) | 48 |
| Óscar | male | 592 | es-CR-JuanNeural | 37 |
| Vikram | male | 593 | es-ES-AlvaroNeural | 33 |
| Priti | female | 560 | es-DO-RamonaNeural | 16 |

<details><summary><b>Eddy</b> — 92 stories</summary>

- 2-4 · Doctor Eddy (#1359)
- 3-3 · A Question (#1362)
- 5-1 · The Dog (#1368)
- 5-3 · A Coffee, Please! (#1370)
- 7-1 · I Need a New Video Game (#1376)
- 7-4 · One Ticket to Barcelona (#1379)
- 8-2 · The Dance Class (#1381)
- 8-3 · You Are Not Mary (#1382)
- 9-1 · Junior Exercises (#1384)
- 9-3 · The Perfect Person (#1386)
- 10-2 · I Want a Dog! (#1389)
- 10-3 · The Model (#1390)
- 11-2 · A New Sport (#1393)
- 12-2 · The Monkeys (#1397)
- 12-3 · That Is Art (#1398)
- 13-1 · I Am Sick (#1400)
- 13-4 · Óscar's Flowers (#1403)
- 14-3 · Junior's Birthday (#1406)
- 16-2 · Pizza Night (#1413)
- 16-4 · Junior's Breakfast (#1415)
- 17-1 · My First Painting (#1416)
- 17-3 · An Emergency (#1418)
- 18-1 · Vikram's Plants (#1420)
- 19-4 · A Problem with the Car (#1427)
- 21-2 · The Seat Is Yours! (#1433)
- 21-3 · Recycling Is Important (#1434)
- 21-4 · Why Did She Break Up with Me? (#1435)
- 23-2 · You're Getting Older (#1441)
- 26-2 · Grandmother's Recipe (#1453)
- 26-4 · The Horoscope Is a Big Lie (#1455)
- 27-1 · Someone Stole My Sandwich (#1456)
- 27-4 · This Tastes Strange (#1459)
- 28-2 · Is It Love? (#1461)
- 29-1 · The Tent (#1464)
- 30-1 · The Blue Duck (#1468)
- 30-3 · The Sweater (#1470)
- 30-4 · A Coffee Artist (#1471)
- 31-1 · My Leg Hurts (#1472)
- 36-1 · I Want to Be Like You (#1492)
- 36-4 · The Hacker (#1495)
- 37-2 · The New Jeans (#1497)
- 38-1 · A Band for Girls (#1500)
- 38-2 · At the Gym (#1501)
- 39-1 · The Magic School (#1504)
- 39-3 · This Isn't Working (#1506)
- 39-4 · Space Turtles (#1507)
- 40-3 · I Need to Practice (#1510)
- 40-4 · Eddy for Mayor! (#1511)
- 41-2 · The Farewell Party (#1513)
- 41-3 · At the Pharmacy (#1514)
- 43-1 · An Old Friend (#1520)
- 43-4 · I Can Do Anything (#1523)
- 44-3 · The Gift (#1526)
- 44-4 · My Head Is Too Big (#1527)
- 45-1 · Eat the Vegetables (#1528)
- 45-2 · Are We Cool? (#1529)
- 45-4 · Are You Sick? (#1531)
- 46-1 · A Cruise at Sunset (#1532)
- 46-3 · The Water Slide (#1534)
- 46-4 · The Magic Trick (#1535)
- 47-3 · Eddy the Princess (#1538)
- 50-2 · That's Not Dinner (#1549)
- 50-3 · Eddy's Haircut (#1550)
- 51-3 · I'm Going to Run a Marathon! (#1554)
- 51-4 · Aliens Exist (#1555)
- 52-2 · I Have No Reception (#1557)
- 53-2 · Junior Can Decide (#1561)
- 54-1 · Junior Makes a Mess (#1564)
- 54-4 · Aunt Betty (#1567)
- 55-4 · Sorry I'm Late (#1571)
- 57-2 · Look at That Whale! (#1577)
- 57-3 · I'll Fix It! (#1578)
- 58-1 · Eddy's Meeting (#1580)
- 58-3 · Is Your Wifi Working? (#1582)
- 59-1 · Call a Doctor! (#1584)
- 60-3 · The Cat Rule (#1590)
- 61-1 · The Yoga Class (#1592)
- 61-2 · The Flu Shot (#1593)
- 61-3 · Where's My Jacket? (#1594)
- 61-4 · The Worst Monkey in the Zoo (#1595)
- 62-2 · A Monster Under the Bed (#1597)
- 63-1 · In the Front Row (#1600)
- 63-2 · A Night Without Junior (#1601)
- 63-4 · Bad at Soccer (#1603)
- 64-4 · Junior's New Business (#1607)
- 65-2 · The Secret Place (#1609)
- 65-3 · Eddy's Tears (#1610)
- 66-2 · The Principal's Office (#1613)
- 66-4 · Some Very Tasty Cookies (#1615)
- 67-1 · Dating Apps (#1616)
- 67-3 · The Videotape (#1618)
- 69-2 · Uncle Edward's House (#1625)

</details>
<details><summary><b>Júnior</b> — 69 stories</summary>

- 3-3 · A Question (#1362)
- 5-1 · The Dog (#1368)
- 5-3 · A Coffee, Please! (#1370)
- 6-4 · The English Test (#1375)
- 7-1 · I Need a New Video Game (#1376)
- 7-4 · One Ticket to Barcelona (#1379)
- 8-3 · You Are Not Mary (#1382)
- 9-1 · Junior Exercises (#1384)
- 10-1 · Junior's Decision (#1388)
- 10-2 · I Want a Dog! (#1389)
- 11-2 · A New Sport (#1393)
- 11-3 · Lucy and the Dinosaurs (#1394)
- 12-2 · The Monkeys (#1397)
- 13-1 · I Am Sick (#1400)
- 14-3 · Junior's Birthday (#1406)
- 15-2 · It's Not for Kids (#1409)
- 16-2 · Pizza Night (#1413)
- 16-4 · Junior's Breakfast (#1415)
- 17-3 · An Emergency (#1418)
- 17-4 · A Love Letter (#1419)
- 20-2 · Hércules's Funeral (#1429)
- 21-3 · Recycling Is Important (#1434)
- 21-4 · Why Did She Break Up with Me? (#1435)
- 27-4 · This Tastes Strange (#1459)
- 29-1 · The Tent (#1464)
- 30-3 · The Sweater (#1470)
- 31-1 · My Leg Hurts (#1472)
- 32-4 · Perfect for the Job (#1479)
- 35-2 · The Boy Who I Love (#1489)
- 36-1 · I Want to Be Like You (#1492)
- 37-2 · The New Jeans (#1497)
- 38-1 · A Band for Girls (#1500)
- 39-1 · The Magic School (#1504)
- 39-4 · Space Turtles (#1507)
- 40-3 · I Need to Practice (#1510)
- 41-3 · At the Pharmacy (#1514)
- 42-2 · The Frog (#1517)
- 43-1 · An Old Friend (#1520)
- 44-2 · I Love Pirates (#1525)
- 44-4 · My Head Is Too Big (#1527)
- 45-1 · Eat the Vegetables (#1528)
- 45-4 · Are You Sick? (#1531)
- 46-3 · The Water Slide (#1534)
- 47-3 · Eddy the Princess (#1538)
- 50-2 · That's Not Dinner (#1549)
- 51-4 · Aliens Exist (#1555)
- 53-2 · Junior Can Decide (#1561)
- 54-1 · Junior Makes a Mess (#1564)
- 54-3 · A Scary Movie (#1566)
- 54-4 · Aunt Betty (#1567)
- 55-2 · Junior's Interview (#1569)
- 56-1 · I like Your Tie (#1572)
- 56-2 · The Accident (#1573)
- 56-4 · This Isn't a Date? (#1575)
- 57-2 · Look at That Whale! (#1577)
- 60-3 · The Cat Rule (#1590)
- 61-2 · The Flu Shot (#1593)
- 61-4 · The Worst Monkey in the Zoo (#1595)
- 62-2 · A Monster Under the Bed (#1597)
- 63-2 · A Night Without Junior (#1601)
- 63-4 · Bad at Soccer (#1603)
- 64-2 · On the News (#1605)
- 64-4 · Junior's New Business (#1607)
- 65-2 · The Secret Place (#1609)
- 66-2 · The Principal's Office (#1613)
- 66-4 · Some Very Tasty Cookies (#1615)
- 67-3 · The Videotape (#1618)
- 68-2 · The Mountain (#1621)
- 69-2 · Uncle Edward's House (#1625)

</details>
<details><summary><b>Bea</b> — 66 stories</summary>

- 1-2 · A Date (#1353)
- 4-4 · The Reservation (#1367)
- 6-1 · At the Supermarket (#1372)
- 6-3 · My vacation in Canada (#1374)
- 7-2 · Where Is Your Girlfriend? (#1377)
- 8-4 · A Family Dinner (#1383)
- 9-3 · The Perfect Person (#1386)
- 12-1 · A Very Dirty Apartment (#1396)
- 12-4 · The Waiter Is Right (#1399)
- 14-1 · I'm Always Late (#1404)
- 15-1 · An Interesting Conversation (#1408)
- 16-3 · The Big Game (#1414)
- 17-2 · The Taxi (#1417)
- 18-3 · The Promotion (#1422)
- 18-4 · The Ex-Girlfriend (#1423)
- 20-1 · A Fishing Trip (#1428)
- 22-4 · A Weekend at Bea's House (#1439)
- 23-2 · You're Getting Older (#1441)
- 23-3 · New Year, New Bea (#1442)
- 24-1 · The Second Date (#1444)
- 24-4 · Too Fast (#1447)
- 25-3 · The Elevator (#1450)
- 26-1 · The Manager's Office (#1452)
- 26-4 · The Horoscope Is a Big Lie (#1455)
- 27-3 · Pasta Problems (#1458)
- 28-1 · The Dragon Cake (#1460)
- 30-2 · Let's Ask for Directions (#1469)
- 31-1 · My Leg Hurts (#1472)
- 31-3 · Dinner with the Director (#1474)
- 32-2 · Zari Learns How to Drive (#1477)
- 33-2 · A Horrible Date (#1481)
- 34-1 · Work from Home (#1484)
- 34-3 · The Perfect Moment (#1486)
- 36-4 · The Hacker (#1495)
- 38-2 · At the Gym (#1501)
- 38-4 · Janet's Play (#1503)
- 39-3 · This Isn't Working (#1506)
- 40-2 · The Party (#1509)
- 41-1 · Famous on Social Media (#1512)
- 41-2 · The Farewell Party (#1513)
- 42-3 · The Interview (#1518)
- 43-4 · I Can Do Anything (#1523)
- 44-3 · The Gift (#1526)
- 45-2 · Are We Cool? (#1529)
- 47-1 · The Boss's Son (#1536)
- 47-2 · The Haunted Hotel (#1537)
- 48-1 · The Book Club (#1540)
- 48-2 · The Baby Photo (#1541)
- 48-4 · The Bride (#1543)
- 49-2 · But I'm Driving (#1545)
- 51-1 · Bea's Date (#1552)
- 55-1 · Twenty Years (#1568)
- 55-2 · Junior's Interview (#1569)
- 58-3 · Is Your Wifi Working? (#1582)
- 60-1 · Something New (#1588)
- 61-3 · Where's My Jacket? (#1594)
- 62-1 · Bea's List (#1596)
- 63-2 · A Night Without Junior (#1601)
- 63-3 · Is it too late? (#1602)
- 64-1 · Can You Give Me the Recipe? (#1604)
- 64-4 · Junior's New Business (#1607)
- 65-2 · The Secret Place (#1609)
- 67-1 · Dating Apps (#1616)
- 67-3 · The Videotape (#1618)
- 68-1 · What Are You Wearing? (#1620)
- 69-1 · I Can Predict the Future (#1624)

</details>
<details><summary><b>Lin</b> — 62 stories</summary>

- 1-3 · One Thing (#1354)
- 3-4 · To the Station! (#1363)
- 4-4 · The Reservation (#1367)
- 6-1 · At the Supermarket (#1372)
- 6-2 · The Perfect Girlfriend (#1373)
- 8-4 · A Family Dinner (#1383)
- 9-4 · Need Help? (#1387)
- 11-4 · Where Are My Keys? (#1395)
- 13-2 · I Want a Pizza (#1401)
- 14-1 · I'm Always Late (#1404)
- 18-2 · The Cake (#1421)
- 18-4 · The Ex-Girlfriend (#1423)
- 19-2 · Send Me an Email (#1425)
- 20-3 · Free Pizza (#1430)
- 23-3 · New Year, New Bea (#1442)
- 24-4 · Too Fast (#1447)
- 25-3 · The Elevator (#1450)
- 25-4 · The Wedding (#1451)
- 26-3 · A Love Story (#1454)
- 27-2 · Do You Want to Break up with Me? (#1457)
- 28-3 · The Boxing Match (#1462)
- 29-3 · Changes (#1466)
- 30-2 · Let's Ask for Directions (#1469)
- 32-3 · Who's Coming to Dinner? (#1478)
- 33-2 · A Horrible Date (#1481)
- 34-3 · The Perfect Moment (#1486)
- 35-3 · Screams on the Night Train (#1490)
- 36-2 · Bird Sitting (#1493)
- 37-4 · The New Roommate (#1499)
- 38-3 · A Very Long Flight (#1502)
- 38-4 · Janet's Play (#1503)
- 39-2 · The Cake Contest (#1505)
- 40-2 · The Party (#1509)
- 41-1 · Famous on Social Media (#1512)
- 43-3 · I Love Boxing (#1522)
- 44-1 · The Tea Set (#1524)
- 45-2 · Are We Cool? (#1529)
- 46-2 · Pajamas and Potato Chips (#1533)
- 47-2 · The Haunted Hotel (#1537)
- 48-1 · The Book Club (#1540)
- 48-3 · The Move (#1542)
- 49-1 · A Very Fancy Wedding (#1544)
- 49-2 · But I'm Driving (#1545)
- 49-3 · Fifty Years Later (#1546)
- 50-1 · The New App (#1548)
- 52-3 · Where Are the Paddles? (#1558)
- 53-2 · Junior Can Decide (#1561)
- 53-3 · The Password (#1562)
- 53-4 · Memories from the Past (#1563)
- 58-3 · Is Your Wifi Working? (#1582)
- 59-2 · Lin's Resume (#1585)
- 59-3 · The Great Baking Show (#1586)
- 60-1 · Something New (#1588)
- 60-4 · It's Forbidden to Feed the Seals (#1591)
- 61-3 · Where's My Jacket? (#1594)
- 62-1 · Bea's List (#1596)
- 65-1 · Too Many Things (#1608)
- 65-4 · I'm Fine! (#1611)
- 68-1 · What Are You Wearing? (#1620)
- 69-1 · I Can Predict the Future (#1624)
- 69-3 · Get Out of Here! (#1626)
- 69-5 · Painting at Sunrise (#1628)

</details>
<details><summary><b>Lili</b> — 51 stories</summary>

- 2-1 · The Red Jacket (#1356)
- 3-2 · The New Student (#1361)
- 4-3 · Clothes for My Vacation (#1366)
- 5-4 · Lily's Clothes (#1371)
- 8-1 · Thanks? (#1380)
- 13-3 · The Diary (#1402)
- 14-4 · What's Your Name? (#1407)
- 15-3 · Too Dangerous (#1410)
- 15-4 · Drawing in the Park (#1411)
- 16-1 · The Art Homework (#1412)
- 20-2 · Hércules's Funeral (#1429)
- 21-1 · My Favorite Band (#1432)
- 22-2 · You Can Talk? (#1437)
- 23-1 · Two Tickets (#1440)
- 23-4 · I'm Going to Rome (#1443)
- 24-3 · The Letter (#1446)
- 25-2 · The Pink Dress (#1449)
- 31-2 · The Old Lady (#1473)
- 32-1 · Airport Vacation (#1476)
- 33-1 · The Best Grade (#1480)
- 33-3 · Is He Calling Me? (#1482)
- 34-2 · The Drawing (#1485)
- 35-1 · A New Hobby (#1488)
- 36-3 · Lily Takes Out the Trash (#1494)
- 37-1 · I Love Your Haircut! (#1496)
- 37-2 · The New Jeans (#1497)
- 42-4 · Lily's Painting (#1519)
- 43-2 · The Fire Alarm (#1521)
- 49-4 · Let's Move the Bed (#1547)
- 52-1 · Space Vikings (#1556)
- 53-1 · Where Is the Dog? (#1560)
- 54-2 · The Audition (#1565)
- 55-3 · The Drummer (#1570)
- 56-1 · I like Your Tie (#1572)
- 56-4 · This Isn't a Date? (#1575)
- 57-4 · Clara's Party (#1579)
- 58-2 · I'm the Manager (#1581)
- 59-4 · The Refund (#1587)
- 60-2 · The Lost Costume (#1589)
- 62-3 · Cousins (#1598)
- 64-2 · On the News (#1605)
- 64-3 · Let's Save the Animals! (#1606)
- 65-2 · The Secret Place (#1609)
- 66-1 · Surprise Party (#1612)
- 66-3 · Is She Mad at Me? (#1614)
- 67-2 · My Horse Hates Me (#1617)
- 67-3 · The Videotape (#1618)
- 67-4 · Remove This Statue (#1619)
- 68-4 · Pirate World (#1623)
- 69-4 · My Card Is Suspended? (#1627)
- 69-7 · A Walk in Nature (#1630)

</details>
<details><summary><b>Zari</b> — 49 stories</summary>

- 2-1 · The Red Jacket (#1356)
- 3-2 · The New Student (#1361)
- 5-2 · What Do You Need? (#1369)
- 5-4 · Lily's Clothes (#1371)
- 6-4 · The English Test (#1375)
- 8-1 · Thanks? (#1380)
- 11-1 · Can You Take My Picture? (#1392)
- 13-3 · The Diary (#1402)
- 14-4 · What's Your Name? (#1407)
- 15-2 · It's Not for Kids (#1409)
- 15-3 · Too Dangerous (#1410)
- 16-1 · The Art Homework (#1412)
- 17-4 · A Love Letter (#1419)
- 21-1 · My Favorite Band (#1432)
- 21-3 · Recycling Is Important (#1434)
- 22-1 · Thanks, Mom (#1436)
- 23-1 · Two Tickets (#1440)
- 23-4 · I'm Going to Rome (#1443)
- 24-3 · The Letter (#1446)
- 32-1 · Airport Vacation (#1476)
- 32-2 · Zari Learns How to Drive (#1477)
- 33-1 · The Best Grade (#1480)
- 33-3 · Is He Calling Me? (#1482)
- 35-2 · The Boy Who I Love (#1489)
- 37-1 · I Love Your Haircut! (#1496)
- 42-4 · Lily's Painting (#1519)
- 43-2 · The Fire Alarm (#1521)
- 44-2 · I Love Pirates (#1525)
- 45-2 · Are We Cool? (#1529)
- 48-2 · The Baby Photo (#1541)
- 49-4 · Let's Move the Bed (#1547)
- 52-1 · Space Vikings (#1556)
- 53-1 · Where Is the Dog? (#1560)
- 54-2 · The Audition (#1565)
- 54-3 · A Scary Movie (#1566)
- 55-3 · The Drummer (#1570)
- 56-1 · I like Your Tie (#1572)
- 56-4 · This Isn't a Date? (#1575)
- 57-4 · Clara's Party (#1579)
- 60-2 · The Lost Costume (#1589)
- 64-2 · On the News (#1605)
- 65-2 · The Secret Place (#1609)
- 66-1 · Surprise Party (#1612)
- 66-3 · Is She Mad at Me? (#1614)
- 67-2 · My Horse Hates Me (#1617)
- 67-4 · Remove This Statue (#1619)
- 68-4 · Pirate World (#1623)
- 69-4 · My Card Is Suspended? (#1627)
- 69-7 · A Walk in Nature (#1630)

</details>
<details><summary><b>Lucía</b> — 48 stories</summary>

- 1-3 · One Thing (#1354)
- 4-3 · Clothes for My Vacation (#1366)
- 10-4 · The Portrait (#1391)
- 11-3 · Lucy and the Dinosaurs (#1394)
- 11-4 · Where Are My Keys? (#1395)
- 13-2 · I Want a Pizza (#1401)
- 14-1 · I'm Always Late (#1404)
- 18-2 · The Cake (#1421)
- 19-2 · Send Me an Email (#1425)
- 24-2 · Can I Take Your Picture? (#1445)
- 25-4 · The Wedding (#1451)
- 26-3 · A Love Story (#1454)
- 27-2 · Do You Want to Break up with Me? (#1457)
- 28-3 · The Boxing Match (#1462)
- 29-3 · Changes (#1466)
- 32-3 · Who's Coming to Dinner? (#1478)
- 35-3 · Screams on the Night Train (#1490)
- 36-3 · Lily Takes Out the Trash (#1494)
- 37-3 · I Have to Tell You the Truth (#1498)
- 37-4 · The New Roommate (#1499)
- 39-2 · The Cake Contest (#1505)
- 40-1 · Some turbulence (#1508)
- 40-4 · Eddy for Mayor! (#1511)
- 41-2 · The Farewell Party (#1513)
- 44-1 · The Tea Set (#1524)
- 45-2 · Are We Cool? (#1529)
- 46-2 · Pajamas and Potato Chips (#1533)
- 47-4 · The Boat Party (#1539)
- 48-3 · The Move (#1542)
- 49-1 · A Very Fancy Wedding (#1544)
- 49-3 · Fifty Years Later (#1546)
- 50-1 · The New App (#1548)
- 50-3 · Eddy's Haircut (#1550)
- 51-2 · Waiting for Jorge (#1553)
- 52-3 · Where Are the Paddles? (#1558)
- 53-3 · The Password (#1562)
- 53-4 · Memories from the Past (#1563)
- 56-2 · The Accident (#1573)
- 56-3 · The Movie Is About to Begin (#1574)
- 57-1 · The Art Show (#1576)
- 60-4 · It's Forbidden to Feed the Seals (#1591)
- 61-1 · The Yoga Class (#1592)
- 63-4 · Bad at Soccer (#1603)
- 65-1 · Too Many Things (#1608)
- 65-2 · The Secret Place (#1609)
- 65-4 · I'm Fine! (#1611)
- 67-3 · The Videotape (#1618)
- 69-3 · Get Out of Here! (#1626)

</details>
<details><summary><b>Óscar</b> — 37 stories</summary>

- 3-4 · To the Station! (#1363)
- 5-2 · What Do You Need? (#1369)
- 10-3 · The Model (#1390)
- 10-4 · The Portrait (#1391)
- 11-1 · Can You Take My Picture? (#1392)
- 12-3 · That Is Art (#1398)
- 13-2 · I Want a Pizza (#1401)
- 13-4 · Óscar's Flowers (#1403)
- 16-1 · The Art Homework (#1412)
- 17-1 · My First Painting (#1416)
- 19-3 · An Excellent Teacher (#1426)
- 21-2 · The Seat Is Yours! (#1433)
- 29-2 · The Movie Premiere (#1465)
- 29-4 · I Want the Sandwich (#1467)
- 30-4 · A Coffee Artist (#1471)
- 31-4 · Óscar in Los Angeles (#1475)
- 37-3 · I Have to Tell You the Truth (#1498)
- 39-2 · The Cake Contest (#1505)
- 40-1 · Some turbulence (#1508)
- 41-2 · The Farewell Party (#1513)
- 41-4 · One Day at the Beach (#1515)
- 43-3 · I Love Boxing (#1522)
- 44-1 · The Tea Set (#1524)
- 46-4 · The Magic Trick (#1535)
- 47-4 · The Boat Party (#1539)
- 52-1 · Space Vikings (#1556)
- 52-2 · I Have No Reception (#1557)
- 54-2 · The Audition (#1565)
- 55-1 · Twenty Years (#1568)
- 57-1 · The Art Show (#1576)
- 57-3 · I'll Fix It! (#1578)
- 58-4 · The Worst Season (#1583)
- 61-3 · Where's My Jacket? (#1594)
- 62-4 · Inhale, Exhale (#1599)
- 63-2 · A Night Without Junior (#1601)
- 64-3 · Let's Save the Animals! (#1606)
- 69-5 · Painting at Sunrise (#1628)

</details>
<details><summary><b>Vikram</b> — 33 stories</summary>

- 1-1 · Good Morning (#1350)
- 2-2 · The Passport (#1357)
- 3-1 · A New Coat (#1360)
- 4-1 · The Vegetarian (#1364)
- 6-3 · My vacation in Canada (#1374)
- 7-3 · The Basketball Player (#1378)
- 9-2 · The Garden (#1385)
- 14-2 · I Don't Work Today (#1405)
- 18-1 · Vikram's Plants (#1420)
- 19-4 · A Problem with the Car (#1427)
- 20-4 · A Surprise Ending (#1431)
- 22-3 · Camping! (#1438)
- 26-2 · Grandmother's Recipe (#1453)
- 28-1 · The Dragon Cake (#1460)
- 28-4 · The Flat Tire (#1463)
- 29-4 · I Want the Sandwich (#1467)
- 33-4 · The Security Question (#1483)
- 34-4 · The Bakery (#1487)
- 35-4 · Vikram's Surprise (#1491)
- 39-2 · The Cake Contest (#1505)
- 42-1 · It's Too Expensive (#1516)
- 45-3 · One Star (#1530)
- 50-2 · That's Not Dinner (#1549)
- 50-4 · The Wedding Present (#1551)
- 52-4 · The Perfect Anniversary (#1559)
- 58-4 · The Worst Season (#1583)
- 59-3 · The Great Baking Show (#1586)
- 64-1 · Can You Give Me the Recipe? (#1604)
- 65-3 · Eddy's Tears (#1610)
- 66-1 · Surprise Party (#1612)
- 66-4 · Some Very Tasty Cookies (#1615)
- 68-3 · A Difficult Person (#1622)
- 69-6 · A Relaxing Weekend (#1629)

</details>
<details><summary><b>Priti</b> — 16 stories</summary>

- 1-1 · Good Morning (#1350)
- 2-2 · The Passport (#1357)
- 7-3 · The Basketball Player (#1378)
- 14-2 · I Don't Work Today (#1405)
- 20-4 · A Surprise Ending (#1431)
- 22-3 · Camping! (#1438)
- 26-2 · Grandmother's Recipe (#1453)
- 28-4 · The Flat Tire (#1463)
- 33-4 · The Security Question (#1483)
- 35-4 · Vikram's Surprise (#1491)
- 42-1 · It's Too Expensive (#1516)
- 45-3 · One Star (#1530)
- 50-4 · The Wedding Present (#1551)
- 66-1 · Surprise Party (#1612)
- 68-3 · A Difficult Person (#1622)
- 69-6 · A Relaxing Weekend (#1629)

</details>

## Recurring side characters (2+ stories)

Grouped by avatar id + verified identity. Same name with different avatar ids = distinct rows.

| Character | Gender | Avatar id | Stories | Note |
|---|---|---|---|---|
| Bruce | male | 385 | The Vegetarian (#1364); The Reservation (#1367); Can I Take Your Picture? (#1445); Pasta Problems (#1458); Call a Doctor! (#1584) | name unconfirmed in text |
| waiter | male | 526 | The Waiter Is Right (#1399); I Want the Sandwich (#1467); The Blue Duck (#1468); One Star (#1530); The Boat Party (#1539) | role (never named) |
| Juan | male | 113 | The Honeymoon (#1355); The Basketball Player (#1378); I Have to Tell You the Truth (#1498) | name unconfirmed in text |
| La madre de Lily | female | 559 | The Pink Dress (#1449); A New Hobby (#1488); Cousins (#1598) |  |
| Martín | male | 1087 | The Perfect Girlfriend (#1373); A Coffee Artist (#1471); The Drummer (#1570) |  |
| Osman | male | 3107 | The Movie Premiere (#1465); Óscar in Los Angeles (#1475); One Day at the Beach (#1515) |  |
| Penélope | female | 658 | You Are Not Mary (#1382); The Movie Premiere (#1465); At the Gym (#1501) |  |
| Roberto | male | 127 | Need Help? (#1387); Too Fast (#1447); I'm the Manager (#1581) | name unconfirmed in text |
| Abel | male | 1321 | I Love Pirates (#1525); Pirate World (#1623) |  |
| Ana | female | 343 | The Honeymoon (#1355); A Very Big Family (#1358) |  |
| Anita | female | 338 | A New Coat (#1360); Lin's Resume (#1585) | name unconfirmed in text |
| Beatriz | female | 386 | A Coffee, Please! (#1370); The Blue Duck (#1468) | name unconfirmed in text |
| Juliana | female | 1715 | The Blue Duck (#1468); At the Pharmacy (#1514) |  |
| La Madre de Juan | female | 988 | It's Too Expensive (#1516); Inhale, Exhale (#1599) | name unconfirmed in text |
| Lucas | male | 823 | Where Is Your Girlfriend? (#1377); The Perfect Anniversary (#1559) | name unconfirmed in text |
| Miguel | male | 790 | The New Student (#1361); The Diary (#1402) |  |
| Salma | female | 342 | The Honeymoon (#1355); A Very Big Family (#1358) |  |
| security guard | male | 1088 | The Drummer (#1570); The Art Show (#1576) | role (never named) |
| Sergio | male | 366 | More Space (#1365); The Mountain (#1621) |  |
| teacher | female | 292 | The Fire Alarm (#1521); The Mountain (#1621) | role (never named) |
| the doctor (Junior's pediatrician) | female | 341 | I Am Sick (#1400); The Flu Shot (#1593) |  |
| Zari's mom | female | 511 | Thanks, Mom (#1436); Airport Vacation (#1476) |  |
| Álex | male | 6 | Dinner with the Director (#1474); The Boss's Son (#1536) |  |

## One-off characters (1 story each)

| Story | Character | Gender | Avatar id | Note |
|---|---|---|---|---|
| 1-2 · A Date (#1353) | Daniel | male | 100 |  |
| 1-2 · A Date (#1353) | Gabriela | female | 101 |  |
| 2-3 · A Very Big Family (#1358) | La madre de Ana | female | 341 |  |
| 2-4 · Doctor Eddy (#1359) | Olga | female | 724 | name unconfirmed in text |
| 4-2 · More Space (#1365) | El padre de Sergio | male | 295 |  |
| 6-2 · The Perfect Girlfriend (#1373) | Verónica | female | 1187 |  |
| 7-4 · One Ticket to Barcelona (#1379) | Sara | female | 659 | name unconfirmed in text |
| 8-2 · The Dance Class (#1381) | Eliana | female | 125 |  |
| 8-3 · You Are Not Mary (#1382) | María (the family's pet bird) | female | 625 |  |
| 9-2 · The Garden (#1385) | La abuela de Vikram | female | 129 |  |
| 10-1 · Junior's Decision (#1388) | Señora Pérez | female | 395 |  |
| 10-4 · The Portrait (#1391) | man who buys the portrait | male | 438 |  |
| 12-1 · A Very Dirty Apartment (#1396) | Marina | female | 175 |  |
| 12-3 · That Is Art (#1398) | man eating his lunch | male | 307 |  |
| 12-4 · The Waiter Is Right (#1399) | Federico | male | 440 |  |
| 14-4 · What's Your Name? (#1407) | guy at the party | male | 419 |  |
| 15-1 · An Interesting Conversation (#1408) | Leo | male | 258 |  |
| 15-1 · An Interesting Conversation (#1408) | Gloria | female | 260 |  |
| 15-3 · Too Dangerous (#1410) | roller coaster attendant | unknown | 300 |  |
| 15-4 · Drawing in the Park (#1411) | Gustavo | male | 1321 |  |
| 16-3 · The Big Game (#1414) | Julio | male | 295 |  |
| 17-2 · The Taxi (#1417) | taxi driver | male | 889 |  |
| 17-3 · An Emergency (#1418) | lifeguard | female | 856 |  |
| 18-3 · The Promotion (#1422) | Bea's boss | male | 2144 |  |
| 18-4 · The Ex-Girlfriend (#1423) | Carla | female | 125 | name unconfirmed in text |
| 19-1 · The Song (#1424) | Bruno | male | 44 |  |
| 19-1 · The Song (#1424) | Héctor | male | 274 |  |
| 19-2 · Send Me an Email (#1425) | Marco | male | 307 |  |
| 19-3 · An Excellent Teacher (#1426) | Jennifer | female | 856 |  |
| 20-1 · A Fishing Trip (#1428) | Bea's dad | male | 6 |  |
| 20-3 · Free Pizza (#1430) | Señora Sánchez | female | 292 |  |
| 20-3 · Free Pizza (#1430) | office worker | unknown | 321 |  |
| 21-2 · The Seat Is Yours! (#1433) | boy who boards the bus | male | 1649 |  |
| 22-2 · You Can Talk? (#1437) | Lily's dog | male | 58 |  |
| 22-4 · A Weekend at Bea's House (#1439) | Álvaro | male | 438 |  |
| 23-1 · Two Tickets (#1440) | Ben | male | 1649 |  |
| 23-3 · New Year, New Bea (#1442) | handsome guy at the party | male | 1088 |  |
| 24-1 · The Second Date (#1444) | José | male | 15 |  |
| 24-3 · The Letter (#1446) | Gabriela | female | 3233 |  |
| 25-1 · I Have a White Hair! (#1448) | Ángela | female | 439 |  |
| 25-1 · I Have a White Hair! (#1448) | Rubén | male | 440 |  |
| 26-1 · The Manager's Office (#1452) | manager | male | 6 |  |
| 27-1 · Someone Stole My Sandwich (#1456) | Elena | female | 125 |  |
| 27-2 · Do You Want to Break up with Me? (#1457) | Samuel | male | 2573 |  |
| 28-2 · Is It Love? (#1461) | Rosa | female | 338 |  |
| 29-1 · The Tent (#1464) | bear | male | 40 |  |
| 29-2 · The Movie Premiere (#1465) | limo driver | unknown | 889 |  |
| 30-2 · Let's Ask for Directions (#1469) | woman giving directions | female | 3134 |  |
| 30-2 · Let's Ask for Directions (#1469) | Jorge | male | 3135 | name unconfirmed in text |
| 30-3 · The Sweater (#1470) | saleswoman | female | 561 |  |
| 30-4 · A Coffee Artist (#1471) | employee | male | 438 |  |
| 31-2 · The Old Lady (#1473) | Lily's boss | male | 44 |  |
| 31-2 · The Old Lady (#1473) | old lady / shoplifter | female | 528 |  |
| 31-3 · Dinner with the Director (#1474) | Paula (the director) | female | 988 |  |
| 32-3 · Who's Coming to Dinner? (#1478) | Francisco | male | 113 |  |
| 32-4 · Perfect for the Job (#1479) | Felipe | male | 2243 |  |
| 32-4 · Perfect for the Job (#1479) | child at ice cream shop | unknown | 2540 |  |
| 32-4 · Perfect for the Job (#1479) | the family's father | male | 3145 |  |
| 33-2 · A Horrible Date (#1481) | Bea's date | male | 438 |  |
| 34-1 · Work from Home (#1484) | Paula (Bea's boss) | female | 988 |  |
| 34-2 · The Drawing (#1485) | Mr. Gómez | male | 57 |  |
| 34-3 · The Perfect Moment (#1486) | Jessica | female | 175 |  |
| 34-4 · The Bakery (#1487) | Leonardo | male | 6 |  |
| 34-4 · The Bakery (#1487) | Juana | female | 1187 |  |
| 36-2 · Bird Sitting (#1493) | Gerardo | male | 7 |  |
| 37-1 · I Love Your Haircut! (#1496) | Ms. Rodríguez | female | 292 |  |
| 37-1 · I Love Your Haircut! (#1496) | Emilia | female | 1616 |  |
| 37-1 · I Love Your Haircut! (#1496) | Sara | female | 3173 |  |
| 37-2 · The New Jeans (#1497) | Lily's boss (store manager) | female | 341 |  |
| 37-4 · The New Roommate (#1499) | Diana | female | 3163 |  |
| 38-1 · A Band for Girls (#1500) | man at the concert | male | 300 |  |
| 38-2 · At the Gym (#1501) | Alberto (Penélope's cousin) | male | 823 |  |
| 38-3 · A Very Long Flight (#1502) | Gabriela | female | 125 |  |
| 38-3 · A Very Long Flight (#1502) | María | female | 338 |  |
| 38-4 · Janet's Play (#1503) | Janet | female | 659 |  |
| 39-3 · This Isn't Working (#1506) | Laura | female | 1848 |  |
| 39-4 · Space Turtles (#1507) | Pamela | female | 1186 |  |
| 40-1 · Some turbulence (#1508) | pilot | male | 3153 |  |
| 40-2 · The Party (#1509) | Bea's boss | male | 6 |  |
| 40-3 · I Need to Practice (#1510) | dad at the concert | male | 6 |  |
| 41-3 · At the Pharmacy (#1514) | Junior's school friend (boy) | male | 1649 |  |
| 41-3 · At the Pharmacy (#1514) | Junior's school friend (boy) | male | 3160 |  |
| 41-3 · At the Pharmacy (#1514) | pharmacist | male | 3162 |  |
| 42-2 · The Frog (#1517) | teacher | male | 57 |  |
| 42-2 · The Frog (#1517) | Beatriz | female | 2540 |  |
| 42-3 · The Interview (#1518) | Víctor | male | 7 |  |
| 42-3 · The Interview (#1518) | interviewer | female | 528 |  |
| 42-4 · Lily's Painting (#1519) | the art gallery owner | female | 341 |  |
| 43-1 · An Old Friend (#1520) | Jorge (Tito's dad) | male | 113 |  |
| 43-3 · I Love Boxing (#1522) | boxing instructor | male | 3145 |  |
| 45-3 · One Star (#1530) | the hotel manager | female | 3299 |  |
| 46-1 · A Cruise at Sunset (#1532) | Rosa | female | 3302 |  |
| 47-1 · The Boss's Son (#1536) | Miguel | male | 366 |  |
| 47-3 · Eddy the Princess (#1538) | Sonia | female | 1848 |  |
| 47-4 · The Boat Party (#1539) | Lorena | female | 3303 | name unconfirmed in text |
| 47-4 · The Boat Party (#1539) | boat owner | male | 3304 |  |
| 48-1 · The Book Club (#1540) | Érica | female | 856 |  |
| 48-1 · The Book Club (#1540) | Janet | female | 3300 |  |
| 48-4 · The Bride (#1543) | the bride | female | 922 |  |
| 51-1 · Bea's Date (#1552) | Nadia | female | 659 |  |
| 51-2 · Waiting for Jorge (#1553) | Elsa | female | 988 |  |
| 51-3 · I'm Going to Run a Marathon! (#1554) | Mimi | female | 1186 |  |
| 51-3 · I'm Going to Run a Marathon! (#1554) | Lizet | female | 1187 |  |
| 53-1 · Where Is the Dog? (#1560) | Édgar | male | 113 |  |
| 53-4 · Memories from the Past (#1563) | Roberto | male | 6 |  |
| 55-4 · Sorry I'm Late (#1571) | Emilia | female | 336 |  |
| 56-3 · The Movie Is About to Begin (#1574) | Victoria | female | 175 |  |
| 56-3 · The Movie Is About to Begin (#1574) | Lorenzo | male | 889 |  |
| 57-2 · Look at That Whale! (#1577) | Sofía | female | 659 |  |
| 57-2 · Look at That Whale! (#1577) | Sofía's daughter | female | 1386 |  |
| 57-4 · Clara's Party (#1579) | Clara | female | 1319 |  |
| 57-4 · Clara's Party (#1579) | Laura | female | 1320 |  |
| 57-4 · Clara's Party (#1579) | boy at the pool | male | 1321 |  |
| 58-1 · Eddy's Meeting (#1580) | Junior's teacher | female | 292 |  |
| 58-2 · I'm the Manager (#1581) | shirt customer | unknown | 438 |  |
| 59-3 · The Great Baking Show (#1586) | TV show director | male | 57 |  |
| 59-4 · The Refund (#1587) | store manager | female | 1186 |  |
| 59-4 · The Refund (#1587) | male customer | male | 1551 |  |
| 60-1 · Something New (#1588) | young skater girl | female | 1386 |  |
| 60-2 · The Lost Costume (#1589) | Julieta | female | 1616 |  |
| 60-4 · It's Forbidden to Feed the Seals (#1591) | boy feeding seals | male | 1321 |  |
| 60-4 · It's Forbidden to Feed the Seals (#1591) | park ranger | female | 1682 |  |
| 61-1 · The Yoga Class (#1592) | yoga instructor | female | 1715 |  |
| 61-3 · Where's My Jacket? (#1594) | saleswoman | female | 260 |  |
| 61-4 · The Worst Monkey in the Zoo (#1595) | zookeeper | male | 1814 |  |
| 62-3 · Cousins (#1598) | Jessica | female | 1847 |  |
| 62-3 · Cousins (#1598) | Aunt Gladys | female | 1848 |  |
| 63-1 · In the Front Row (#1600) | Yanira | female | 658 |  |
| 63-1 · In the Front Row (#1600) | Mariana Flores | female | 724 |  |
| 63-3 · Is it too late? (#1602) | airport employee | male | 2243 |  |
| 64-1 · Can You Give Me the Recipe? (#1604) | baker | male | 2705 |  |
| 64-2 · On the News (#1605) | man Zari tries to help cross the street | male | 2573 |  |
| 64-2 · On the News (#1605) | reporter | male | 2606 |  |
| 64-3 · Let's Save the Animals! (#1606) | Gonzalo | male | 100 |  |
| 65-1 · Too Many Things (#1608) | Mei | female | 2837 |  |
| 65-4 · I'm Fine! (#1611) | Gilberto | male | 438 |  |
| 66-2 · The Principal's Office (#1613) | Principal Fernández | female | 988 |  |
| 66-3 · Is She Mad at Me? (#1614) | Amanda | female | 1847 |  |
| 67-2 · My Horse Hates Me (#1617) | El abuelo de Carmen | male | 2474 | name unconfirmed in text |
| 67-4 · Remove This Statue (#1619) | school principal | male | 2210 |  |
| 68-1 · What Are You Wearing? (#1620) | photographer | male | 57 |  |
| 68-1 · What Are You Wearing? (#1620) | Mimi Ma | female | 561 |  |
| 68-2 · The Mountain (#1621) | classmate | unknown | 2540 |  |
| 68-3 · A Difficult Person (#1622) | Andrés | male | 44 |  |
| 68-4 · Pirate World (#1623) | Abel's parrot (unnamed) | female | 625 |  |
| 69-3 · Get Out of Here! (#1626) | Pierre | male | 6 |  |
| 69-3 · Get Out of Here! (#1626) | Raúl | male | 440 |  |
| 69-3 · Get Out of Here! (#1626) | violinist | male | 2210 |  |
| 69-3 · Get Out of Here! (#1626) | café owner | male | 2905 |  |
| 69-4 · My Card Is Suspended? (#1627) | librarian | female | 292 |  |
| 69-5 · Painting at Sunrise (#1628) | picnicking family member | unknown | 6 |  |
| 69-5 · Painting at Sunrise (#1628) | tourist | unknown | 7 |  |
| 69-5 · Painting at Sunrise (#1628) | hiker | female | 2276 |  |
| 69-6 · A Relaxing Weekend (#1629) | receptionist | female | 2276 |  |

## Avatar-mapping names that contradict the story text

| Story | Avatar id | Mapping name | Actually in story |
|---|---|---|---|
| 8-2 · The Dance Class (#1381) | 125 | Carla | Eliana |
| 13-1 · I Am Sick (#1400) | 341 | La madre de Ana | the doctor (Junior's pediatrician) |
| 16-3 · The Big Game (#1414) | 295 | El padre de Sergio | Julio |
| 25-2 · The Pink Dress (#1449) | 559 | La madre de Bruce | La madre de Lily |
| 27-1 · Someone Stole My Sandwich (#1456) | 125 | Carla | Elena |
| 28-2 · Is It Love? (#1461) | 338 | Anita | Rosa |
| 31-3 · Dinner with the Director (#1474) | 988 | La Madre de Juan | Paula (the director) |
| 32-3 · Who's Coming to Dinner? (#1478) | 113 | Juan | Francisco |
| 34-1 · Work from Home (#1484) | 988 | La Madre de Juan | Paula (Bea's boss) |
| 34-4 · The Bakery (#1487) | 1187 | Verónica | Juana |
| 35-1 · A New Hobby (#1488) | 559 | La madre de Bruce | La madre de Lily |
| 37-2 · The New Jeans (#1497) | 341 | La madre de Ana | Lily's boss (store manager) |
| 38-2 · At the Gym (#1501) | 823 | Lucas | Alberto (Penélope's cousin) |
| 38-3 · A Very Long Flight (#1502) | 125 | Carla | Gabriela |
| 38-3 · A Very Long Flight (#1502) | 338 | Anita | María |
| 38-4 · Janet's Play (#1503) | 659 | Sara | Janet |
| 42-4 · Lily's Painting (#1519) | 341 | La madre de Ana | the art gallery owner |
| 43-1 · An Old Friend (#1520) | 113 | Juan | Jorge (Tito's dad) |
| 45-3 · One Star (#1530) | 3299 | La Madre de Juan | the hotel manager |
| 47-1 · The Boss's Son (#1536) | 366 | Sergio | Miguel |
| 51-1 · Bea's Date (#1552) | 659 | Sara | Nadia |
| 51-2 · Waiting for Jorge (#1553) | 988 | La Madre de Juan | Elsa |
| 51-3 · I'm Going to Run a Marathon! (#1554) | 1187 | Verónica | Lizet |
| 53-1 · Where Is the Dog? (#1560) | 113 | Juan | Édgar |
| 57-2 · Look at That Whale! (#1577) | 659 | Sara | Sofía |
| 57-4 · Clara's Party (#1579) | 1320 | Carmen | Laura |
| 61-2 · The Flu Shot (#1593) | 341 | La madre de Ana | the doctor (Junior's pediatrician) |
| 62-3 · Cousins (#1598) | 559 | La madre de Bruce | La madre de Lily |
| 63-1 · In the Front Row (#1600) | 658 | Penélope | Yanira |
| 63-1 · In the Front Row (#1600) | 724 | Olga | Mariana Flores |
| 64-3 · Let's Save the Animals! (#1606) | 100 | Daniel | Gonzalo |
| 66-2 · The Principal's Office (#1613) | 988 | La Madre de Juan | Principal Fernández |
| 68-4 · Pirate World (#1623) | 625 | María | Abel's parrot (unnamed) |

## Recommended canonical avatar names (for reused avatars)

Per avatar, all verified per-story identities were counted. A recommendation is only meaningful where one identity actually dominates; for most reused avatars every appearance is a *different* one-off character, so any single canonical name will be wrong in the other stories (per-story name overrides would be the real fix).

### Clear majority — safe to set as the canonical name

| Avatar id | Current name | Recommended | Basis |
|---|---|---|---|
| 526 | — | waiter | 5/5 appearances |
| 1088 | — | security guard | 2/3 appearances |
| 559 | La madre de Bruce | La madre de Lily | 3/3 appearances |
| 3107 | — | Osman | 3/3 appearances |
| 1715 | — | Juliana | 2/3 appearances |
| 511 | — | Zari's mom | 2/2 appearances |

### Current name is already the best available — keep

| Avatar id | Name | Basis |
|---|---|---|
| 341 | La madre de Ana | 1/5 text-confirmed |
| 385 | Bruce | 5/5 (never contradicted) |
| 658 | Penélope | 2/4 text-confirmed |
| 366 | Sergio | 2/3 text-confirmed |
| 1087 | Martín | 1/3 text-confirmed |
| 1187 | Verónica | 1/3 text-confirmed |
| 127 | Roberto | 3/3 (never contradicted) |
| 100 | Daniel | 1/2 text-confirmed |
| 342 | Salma | 2/2 text-confirmed |
| 343 | Ana | 2/2 text-confirmed |
| 790 | Miguel | 2/2 text-confirmed |
| 295 | El padre de Sergio | 1/2 text-confirmed |
| 386 | Beatriz | 2/2 (never contradicted) |

### No majority — every appearance is a different character (pick is arbitrary)

Most frequent single identity shown; the full per-story identity list is in the sections above and in the JSON.

| Avatar id | Current name | Most frequent identity | Basis |
|---|---|---|---|
| 6 | — | Álex | 2/10 |
| 113 | Juan | Francisco | 1/6 |
| 438 | — | Álvaro | 1/6 |
| 292 | — | Señora Sánchez | 1/6 |
| 988 | La Madre de Juan | Paula (the director) | 1/6 |
| 1321 | — | Abel | 2/5 |
| 338 | Anita | Rosa | 1/4 |
| 659 | Sara | Janet | 1/4 |
| 125 | Carla | Eliana | 1/4 |
| 57 | — | Mr. Gómez | 1/4 |
| 823 | Lucas | Alberto (Penélope's cousin) | 1/3 |
| 175 | — | Marina | 1/3 |
| 440 | — | Federico | 1/3 |
| 889 | — | Lorenzo | 1/3 |
| 856 | — | Jennifer | 1/3 |
| 44 | — | Bruno | 1/3 |
| 1649 | — | Ben | 1/3 |
| 2540 | — | Beatriz | 1/3 |
| 7 | — | Gerardo | 1/3 |
| 1848 | — | Laura | 1/3 |
| 1186 | — | Pamela | 1/3 |
| 724 | Olga | Mariana Flores | 1/2 |
| 625 | María | María (the family's pet bird) | 1/2 |
| 307 | — | Marco | 1/2 |
| 260 | — | Gloria | 1/2 |
| 300 | — | roller coaster attendant | 1/2 |
| 2573 | — | Samuel | 1/2 |
| 561 | — | Mimi Ma | 1/2 |
| 528 | — | old lady / shoplifter | 1/2 |
| 2243 | — | Felipe | 1/2 |
| 3145 | — | the family's father | 1/2 |
| 1616 | — | Emilia | 1/2 |
| 1386 | — | Sofía's daughter | 1/2 |
| 1847 | — | Jessica | 1/2 |
| 2210 | — | school principal | 1/2 |
| 2276 | — | hiker | 1/2 |

## Story index (all 279 stories)

- **1-1 · Good Morning** (#1350): Priti (female), Vikram (male)
- **1-2 · A Date** (#1353): Daniel (male), Gabriela (female), Bea (female)
- **1-3 · One Thing** (#1354): Lin (female), Lucía (female)
- **1-4 · The Honeymoon** (#1355): Juan (male), Salma (female), Ana (female)
- **2-1 · The Red Jacket** (#1356): Lili (female), Zari (female)
- **2-2 · The Passport** (#1357): Priti (female), Vikram (male)
- **2-3 · A Very Big Family** (#1358): La madre de Ana (female), Salma (female), Ana (female)
- **2-4 · Doctor Eddy** (#1359): Eddy (male), Olga (female)
- **3-1 · A New Coat** (#1360): Anita (female), Vikram (male)
- **3-2 · The New Student** (#1361): Lili (female), Zari (female), Miguel (male)
- **3-3 · A Question** (#1362): Eddy (male), Júnior (male)
- **3-4 · To the Station!** (#1363): Lin (female), Óscar (male)
- **4-1 · The Vegetarian** (#1364): Bruce (male), Vikram (male)
- **4-2 · More Space** (#1365): El padre de Sergio (male), Sergio (male)
- **4-3 · Clothes for My Vacation** (#1366): Lili (female), Lucía (female)
- **4-4 · The Reservation** (#1367): Bruce (male), Bea (female), Lin (female)
- **5-1 · The Dog** (#1368): Eddy (male), Júnior (male)
- **5-2 · What Do You Need?** (#1369): Zari (female), Óscar (male)
- **5-3 · A Coffee, Please!** (#1370): Beatriz (female), Eddy (male), Júnior (male)
- **5-4 · Lily's Clothes** (#1371): Lili (female), Zari (female)
- **6-1 · At the Supermarket** (#1372): Bea (female), Lin (female)
- **6-2 · The Perfect Girlfriend** (#1373): Lin (female), Martín (male), Verónica (female)
- **6-3 · My vacation in Canada** (#1374): Bea (female), Vikram (male)
- **6-4 · The English Test** (#1375): Júnior (male), Zari (female)
- **7-1 · I Need a New Video Game** (#1376): Eddy (male), Júnior (male)
- **7-2 · Where Is Your Girlfriend?** (#1377): Bea (female), Lucas (male)
- **7-3 · The Basketball Player** (#1378): Juan (male), Priti (female), Vikram (male)
- **7-4 · One Ticket to Barcelona** (#1379): Eddy (male), Júnior (male), Sara (female)
- **8-1 · Thanks?** (#1380): Lili (female), Zari (female)
- **8-2 · The Dance Class** (#1381): Eliana (female), Eddy (male)
- **8-3 · You Are Not Mary** (#1382): Eddy (male), Júnior (male), María (the family's pet bird) (female), Penélope (female)
- **8-4 · A Family Dinner** (#1383): Bea (female), Lin (female)
- **9-1 · Junior Exercises** (#1384): Eddy (male), Júnior (male)
- **9-2 · The Garden** (#1385): La abuela de Vikram (female), Vikram (male)
- **9-3 · The Perfect Person** (#1386): Eddy (male), Bea (female)
- **9-4 · Need Help?** (#1387): Roberto (male), Lin (female)
- **10-1 · Junior's Decision** (#1388): Señora Pérez (female), Júnior (male)
- **10-2 · I Want a Dog!** (#1389): Eddy (male), Júnior (male)
- **10-3 · The Model** (#1390): Eddy (male), Óscar (male)
- **10-4 · The Portrait** (#1391): man who buys the portrait (male), Lucía (female), Óscar (male)
- **11-1 · Can You Take My Picture?** (#1392): Zari (female), Óscar (male)
- **11-2 · A New Sport** (#1393): Eddy (male), Júnior (male)
- **11-3 · Lucy and the Dinosaurs** (#1394): Júnior (male), Lucía (female)
- **11-4 · Where Are My Keys?** (#1395): Lin (female), Lucía (female)
- **12-1 · A Very Dirty Apartment** (#1396): Marina (female), Bea (female)
- **12-2 · The Monkeys** (#1397): Eddy (male), Júnior (male)
- **12-3 · That Is Art** (#1398): man eating his lunch (male), Eddy (male), Óscar (male)
- **12-4 · The Waiter Is Right** (#1399): Federico (male), Bea (female), waiter (male)
- **13-1 · I Am Sick** (#1400): the doctor (Junior's pediatrician) (female), Eddy (male), Júnior (male)
- **13-2 · I Want a Pizza** (#1401): Lin (female), Lucía (female), Óscar (male)
- **13-3 · The Diary** (#1402): Lili (female), Zari (female), Miguel (male)
- **13-4 · Óscar's Flowers** (#1403): Eddy (male), Óscar (male)
- **14-1 · I'm Always Late** (#1404): Bea (female), Lin (female), Lucía (female)
- **14-2 · I Don't Work Today** (#1405): Priti (female), Vikram (male)
- **14-3 · Junior's Birthday** (#1406): Eddy (male), Júnior (male)
- **14-4 · What's Your Name?** (#1407): Lili (female), Zari (female), guy at the party (male)
- **15-1 · An Interesting Conversation** (#1408): Leo (male), Gloria (female), Bea (female)
- **15-2 · It's Not for Kids** (#1409): Júnior (male), Zari (female)
- **15-3 · Too Dangerous** (#1410): roller coaster attendant (unknown), Lili (female), Zari (female)
- **15-4 · Drawing in the Park** (#1411): Lili (female), Gustavo (male)
- **16-1 · The Art Homework** (#1412): Lili (female), Zari (female), Óscar (male)
- **16-2 · Pizza Night** (#1413): Eddy (male), Júnior (male)
- **16-3 · The Big Game** (#1414): Julio (male), Bea (female)
- **16-4 · Junior's Breakfast** (#1415): Eddy (male), Júnior (male)
- **17-1 · My First Painting** (#1416): Eddy (male), Óscar (male)
- **17-2 · The Taxi** (#1417): Bea (female), taxi driver (male)
- **17-3 · An Emergency** (#1418): Eddy (male), Júnior (male), lifeguard (female)
- **17-4 · A Love Letter** (#1419): Júnior (male), Zari (female)
- **18-1 · Vikram's Plants** (#1420): Eddy (male), Vikram (male)
- **18-2 · The Cake** (#1421): Lin (female), Lucía (female)
- **18-3 · The Promotion** (#1422): Bea (female), Bea's boss (male)
- **18-4 · The Ex-Girlfriend** (#1423): Carla (female), Bea (female), Lin (female)
- **19-1 · The Song** (#1424): Bruno (male), Héctor (male)
- **19-2 · Send Me an Email** (#1425): Marco (male), Lin (female), Lucía (female)
- **19-3 · An Excellent Teacher** (#1426): Óscar (male), Jennifer (female)
- **19-4 · A Problem with the Car** (#1427): Eddy (male), Vikram (male)
- **20-1 · A Fishing Trip** (#1428): Bea's dad (male), Bea (female)
- **20-2 · Hércules's Funeral** (#1429): Júnior (male), Lili (female)
- **20-3 · Free Pizza** (#1430): Señora Sánchez (female), office worker (unknown), Lin (female)
- **20-4 · A Surprise Ending** (#1431): Priti (female), Vikram (male)
- **21-1 · My Favorite Band** (#1432): Lili (female), Zari (female)
- **21-2 · The Seat Is Yours!** (#1433): Eddy (male), Óscar (male), boy who boards the bus (male)
- **21-3 · Recycling Is Important** (#1434): Eddy (male), Júnior (male), Zari (female)
- **21-4 · Why Did She Break Up with Me?** (#1435): Eddy (male), Júnior (male)
- **22-1 · Thanks, Mom** (#1436): Zari (female), Zari's mom (female)
- **22-2 · You Can Talk?** (#1437): Lily's dog (male), Lili (female)
- **22-3 · Camping!** (#1438): Priti (female), Vikram (male)
- **22-4 · A Weekend at Bea's House** (#1439): Álvaro (male), Bea (female)
- **23-1 · Two Tickets** (#1440): Lili (female), Zari (female), Ben (male)
- **23-2 · You're Getting Older** (#1441): Eddy (male), Bea (female)
- **23-3 · New Year, New Bea** (#1442): Bea (female), Lin (female), handsome guy at the party (male)
- **23-4 · I'm Going to Rome** (#1443): Lili (female), Zari (female)
- **24-1 · The Second Date** (#1444): José (male), Bea (female)
- **24-2 · Can I Take Your Picture?** (#1445): Bruce (male), Lucía (female)
- **24-3 · The Letter** (#1446): Lili (female), Zari (female), Gabriela (female)
- **24-4 · Too Fast** (#1447): Roberto (male), Bea (female), Lin (female)
- **25-1 · I Have a White Hair!** (#1448): Ángela (female), Rubén (male)
- **25-2 · The Pink Dress** (#1449): Lili (female), La madre de Lily (female)
- **25-3 · The Elevator** (#1450): Bea (female), Lin (female)
- **25-4 · The Wedding** (#1451): Lin (female), Lucía (female)
- **26-1 · The Manager's Office** (#1452): manager (male), Bea (female)
- **26-2 · Grandmother's Recipe** (#1453): Eddy (male), Priti (female), Vikram (male)
- **26-3 · A Love Story** (#1454): Lin (female), Lucía (female)
- **26-4 · The Horoscope Is a Big Lie** (#1455): Eddy (male), Bea (female)
- **27-1 · Someone Stole My Sandwich** (#1456): Elena (female), Eddy (male)
- **27-2 · Do You Want to Break up with Me?** (#1457): Lin (female), Lucía (female), Samuel (male)
- **27-3 · Pasta Problems** (#1458): Bruce (male), Bea (female)
- **27-4 · This Tastes Strange** (#1459): Eddy (male), Júnior (male)
- **28-1 · The Dragon Cake** (#1460): Bea (female), Vikram (male)
- **28-2 · Is It Love?** (#1461): Rosa (female), Eddy (male)
- **28-3 · The Boxing Match** (#1462): Lin (female), Lucía (female)
- **28-4 · The Flat Tire** (#1463): Priti (female), Vikram (male)
- **29-1 · The Tent** (#1464): bear (male), Eddy (male), Júnior (male)
- **29-2 · The Movie Premiere** (#1465): Óscar (male), Penélope (female), limo driver (unknown), Osman (male)
- **29-3 · Changes** (#1466): Lin (female), Lucía (female)
- **29-4 · I Want the Sandwich** (#1467): waiter (male), Óscar (male), Vikram (male)
- **30-1 · The Blue Duck** (#1468): Beatriz (female), Eddy (male), waiter (male), Juliana (female)
- **30-2 · Let's Ask for Directions** (#1469): Bea (female), Lin (female), woman giving directions (female), Jorge (male)
- **30-3 · The Sweater** (#1470): Eddy (male), Júnior (male), saleswoman (female)
- **30-4 · A Coffee Artist** (#1471): Eddy (male), employee (male), Óscar (male), Martín (male)
- **31-1 · My Leg Hurts** (#1472): Eddy (male), Júnior (male), Bea (female)
- **31-2 · The Old Lady** (#1473): Lily's boss (male), Lili (female), old lady / shoplifter (female)
- **31-3 · Dinner with the Director** (#1474): Álex (male), Bea (female), Paula (the director) (female)
- **31-4 · Óscar in Los Angeles** (#1475): Óscar (male), Osman (male)
- **32-1 · Airport Vacation** (#1476): Lili (female), Zari (female), Zari's mom (female)
- **32-2 · Zari Learns How to Drive** (#1477): Zari (female), Bea (female)
- **32-3 · Who's Coming to Dinner?** (#1478): Francisco (male), Lin (female), Lucía (female)
- **32-4 · Perfect for the Job** (#1479): Júnior (male), Felipe (male), child at ice cream shop (unknown), the family's father (male)
- **33-1 · The Best Grade** (#1480): Lili (female), Zari (female)
- **33-2 · A Horrible Date** (#1481): Bea's date (male), Bea (female), Lin (female)
- **33-3 · Is He Calling Me?** (#1482): Lili (female), Zari (female)
- **33-4 · The Security Question** (#1483): Priti (female), Vikram (male)
- **34-1 · Work from Home** (#1484): Bea (female), Paula (Bea's boss) (female)
- **34-2 · The Drawing** (#1485): Mr. Gómez (male), Lili (female)
- **34-3 · The Perfect Moment** (#1486): Jessica (female), Bea (female), Lin (female)
- **34-4 · The Bakery** (#1487): Leonardo (male), Vikram (male), Juana (female)
- **35-1 · A New Hobby** (#1488): Lili (female), La madre de Lily (female)
- **35-2 · The Boy Who I Love** (#1489): Júnior (male), Zari (female)
- **35-3 · Screams on the Night Train** (#1490): Lin (female), Lucía (female)
- **35-4 · Vikram's Surprise** (#1491): Priti (female), Vikram (male)
- **36-1 · I Want to Be Like You** (#1492): Eddy (male), Júnior (male)
- **36-2 · Bird Sitting** (#1493): Gerardo (male), Lin (female)
- **36-3 · Lily Takes Out the Trash** (#1494): Lili (female), Lucía (female)
- **36-4 · The Hacker** (#1495): Eddy (male), Bea (female)
- **37-1 · I Love Your Haircut!** (#1496): Ms. Rodríguez (female), Lili (female), Zari (female), Emilia (female), Sara (female)
- **37-2 · The New Jeans** (#1497): Lily's boss (store manager) (female), Eddy (male), Júnior (male), Lili (female)
- **37-3 · I Have to Tell You the Truth** (#1498): Juan (male), Lucía (female), Óscar (male)
- **37-4 · The New Roommate** (#1499): Lin (female), Lucía (female), Diana (female)
- **38-1 · A Band for Girls** (#1500): man at the concert (male), Eddy (male), Júnior (male)
- **38-2 · At the Gym** (#1501): Eddy (male), Bea (female), Penélope (female), Alberto (Penélope's cousin) (male)
- **38-3 · A Very Long Flight** (#1502): Gabriela (female), María (female), Lin (female)
- **38-4 · Janet's Play** (#1503): Bea (female), Lin (female), Janet (female)
- **39-1 · The Magic School** (#1504): Eddy (male), Júnior (male)
- **39-2 · The Cake Contest** (#1505): Lin (female), Lucía (female), Óscar (male), Vikram (male)
- **39-3 · This Isn't Working** (#1506): Eddy (male), Bea (female), Laura (female)
- **39-4 · Space Turtles** (#1507): Eddy (male), Júnior (male), Pamela (female)
- **40-1 · Some turbulence** (#1508): Lucía (female), Óscar (male), pilot (male)
- **40-2 · The Party** (#1509): Bea's boss (male), Bea (female), Lin (female)
- **40-3 · I Need to Practice** (#1510): dad at the concert (male), Eddy (male), Júnior (male)
- **40-4 · Eddy for Mayor!** (#1511): Eddy (male), Lucía (female)
- **41-1 · Famous on Social Media** (#1512): Bea (female), Lin (female)
- **41-2 · The Farewell Party** (#1513): Eddy (male), Bea (female), Lucía (female), Óscar (male)
- **41-3 · At the Pharmacy** (#1514): Eddy (male), Júnior (male), Junior's school friend (boy) (male), Juliana (female), Junior's school friend (boy) (male), pharmacist (male)
- **41-4 · One Day at the Beach** (#1515): Óscar (male), Osman (male)
- **42-1 · It's Too Expensive** (#1516): Priti (female), Vikram (male), La Madre de Juan (female)
- **42-2 · The Frog** (#1517): teacher (male), Júnior (male), Beatriz (female)
- **42-3 · The Interview** (#1518): Víctor (male), Bea (female), interviewer (female)
- **42-4 · Lily's Painting** (#1519): the art gallery owner (female), Lili (female), Zari (female)
- **43-1 · An Old Friend** (#1520): Jorge (Tito's dad) (male), Eddy (male), Júnior (male)
- **43-2 · The Fire Alarm** (#1521): teacher (female), Lili (female), Zari (female)
- **43-3 · I Love Boxing** (#1522): Lin (female), Óscar (male), boxing instructor (male)
- **43-4 · I Can Do Anything** (#1523): Eddy (male), Bea (female)
- **44-1 · The Tea Set** (#1524): Lin (female), Lucía (female), Óscar (male)
- **44-2 · I Love Pirates** (#1525): Júnior (male), Zari (female), Abel (male)
- **44-3 · The Gift** (#1526): Eddy (male), Bea (female)
- **44-4 · My Head Is Too Big** (#1527): Eddy (male), Júnior (male)
- **45-1 · Eat the Vegetables** (#1528): Eddy (male), Júnior (male)
- **45-2 · Are We Cool?** (#1529): Eddy (male), Zari (female), Bea (female), Lin (female), Lucía (female)
- **45-3 · One Star** (#1530): waiter (male), Priti (female), Vikram (male), the hotel manager (female)
- **45-4 · Are You Sick?** (#1531): Eddy (male), Júnior (male)
- **46-1 · A Cruise at Sunset** (#1532): Eddy (male), Rosa (female)
- **46-2 · Pajamas and Potato Chips** (#1533): Lin (female), Lucía (female)
- **46-3 · The Water Slide** (#1534): Eddy (male), Júnior (male)
- **46-4 · The Magic Trick** (#1535): Eddy (male), Óscar (male)
- **47-1 · The Boss's Son** (#1536): Álex (male), Miguel (male), Bea (female)
- **47-2 · The Haunted Hotel** (#1537): Bea (female), Lin (female)
- **47-3 · Eddy the Princess** (#1538): Eddy (male), Júnior (male), Sonia (female)
- **47-4 · The Boat Party** (#1539): Lucía (female), waiter (male), Óscar (male), Lorena (female), boat owner (male)
- **48-1 · The Book Club** (#1540): Bea (female), Lin (female), Érica (female), Janet (female)
- **48-2 · The Baby Photo** (#1541): Zari (female), Bea (female)
- **48-3 · The Move** (#1542): Lin (female), Lucía (female)
- **48-4 · The Bride** (#1543): Bea (female), the bride (female)
- **49-1 · A Very Fancy Wedding** (#1544): Lin (female), Lucía (female)
- **49-2 · But I'm Driving** (#1545): Bea (female), Lin (female)
- **49-3 · Fifty Years Later** (#1546): Lin (female), Lucía (female)
- **49-4 · Let's Move the Bed** (#1547): Lili (female), Zari (female)
- **50-1 · The New App** (#1548): Lin (female), Lucía (female)
- **50-2 · That's Not Dinner** (#1549): Eddy (male), Júnior (male), Vikram (male)
- **50-3 · Eddy's Haircut** (#1550): Eddy (male), Lucía (female)
- **50-4 · The Wedding Present** (#1551): Priti (female), Vikram (male)
- **51-1 · Bea's Date** (#1552): Bea (female), Nadia (female)
- **51-2 · Waiting for Jorge** (#1553): Lucía (female), Elsa (female)
- **51-3 · I'm Going to Run a Marathon!** (#1554): Eddy (male), Mimi (female), Lizet (female)
- **51-4 · Aliens Exist** (#1555): Eddy (male), Júnior (male)
- **52-1 · Space Vikings** (#1556): Lili (female), Zari (female), Óscar (male)
- **52-2 · I Have No Reception** (#1557): Eddy (male), Óscar (male)
- **52-3 · Where Are the Paddles?** (#1558): Lin (female), Lucía (female)
- **52-4 · The Perfect Anniversary** (#1559): Vikram (male), Lucas (male)
- **53-1 · Where Is the Dog?** (#1560): Édgar (male), Lili (female), Zari (female)
- **53-2 · Junior Can Decide** (#1561): Eddy (male), Júnior (male), Lin (female)
- **53-3 · The Password** (#1562): Lin (female), Lucía (female)
- **53-4 · Memories from the Past** (#1563): Roberto (male), Lin (female), Lucía (female)
- **54-1 · Junior Makes a Mess** (#1564): Eddy (male), Júnior (male)
- **54-2 · The Audition** (#1565): Lili (female), Zari (female), Óscar (male)
- **54-3 · A Scary Movie** (#1566): Júnior (male), Zari (female)
- **54-4 · Aunt Betty** (#1567): Eddy (male), Júnior (male)
- **55-1 · Twenty Years** (#1568): Bea (female), Óscar (male)
- **55-2 · Junior's Interview** (#1569): Júnior (male), Bea (female)
- **55-3 · The Drummer** (#1570): Lili (female), Zari (female), Martín (male), security guard (male)
- **55-4 · Sorry I'm Late** (#1571): Emilia (female), Eddy (male)
- **56-1 · I like Your Tie** (#1572): Júnior (male), Lili (female), Zari (female)
- **56-2 · The Accident** (#1573): Júnior (male), Lucía (female)
- **56-3 · The Movie Is About to Begin** (#1574): Victoria (female), Lucía (female), Lorenzo (male)
- **56-4 · This Isn't a Date?** (#1575): Júnior (male), Lili (female), Zari (female)
- **57-1 · The Art Show** (#1576): Lucía (female), Óscar (male), security guard (male)
- **57-2 · Look at That Whale!** (#1577): Eddy (male), Júnior (male), Sofía (female), Sofía's daughter (female)
- **57-3 · I'll Fix It!** (#1578): Eddy (male), Óscar (male)
- **57-4 · Clara's Party** (#1579): Lili (female), Zari (female), Clara (female), Laura (female), boy at the pool (male)
- **58-1 · Eddy's Meeting** (#1580): Junior's teacher (female), Eddy (male)
- **58-2 · I'm the Manager** (#1581): Roberto (male), Lili (female), shirt customer (unknown)
- **58-3 · Is Your Wifi Working?** (#1582): Eddy (male), Bea (female), Lin (female)
- **58-4 · The Worst Season** (#1583): Óscar (male), Vikram (male)
- **59-1 · Call a Doctor!** (#1584): Bruce (male), Eddy (male)
- **59-2 · Lin's Resume** (#1585): Anita (female), Lin (female)
- **59-3 · The Great Baking Show** (#1586): TV show director (male), Lin (female), Vikram (male)
- **59-4 · The Refund** (#1587): Lili (female), store manager (female), male customer (male)
- **60-1 · Something New** (#1588): Bea (female), Lin (female), young skater girl (female)
- **60-2 · The Lost Costume** (#1589): Lili (female), Zari (female), Julieta (female)
- **60-3 · The Cat Rule** (#1590): Eddy (male), Júnior (male)
- **60-4 · It's Forbidden to Feed the Seals** (#1591): Lin (female), Lucía (female), boy feeding seals (male), park ranger (female)
- **61-1 · The Yoga Class** (#1592): Eddy (male), Lucía (female), yoga instructor (female)
- **61-2 · The Flu Shot** (#1593): the doctor (Junior's pediatrician) (female), Eddy (male), Júnior (male)
- **61-3 · Where's My Jacket?** (#1594): saleswoman (female), Eddy (male), Bea (female), Lin (female), Óscar (male)
- **61-4 · The Worst Monkey in the Zoo** (#1595): Eddy (male), Júnior (male), zookeeper (male)
- **62-1 · Bea's List** (#1596): Bea (female), Lin (female)
- **62-2 · A Monster Under the Bed** (#1597): Eddy (male), Júnior (male)
- **62-3 · Cousins** (#1598): Lili (female), La madre de Lily (female), Jessica (female), Aunt Gladys (female)
- **62-4 · Inhale, Exhale** (#1599): Óscar (male), La Madre de Juan (female)
- **63-1 · In the Front Row** (#1600): Eddy (male), Yanira (female), Mariana Flores (female)
- **63-2 · A Night Without Junior** (#1601): Eddy (male), Júnior (male), Bea (female), Óscar (male)
- **63-3 · Is it too late?** (#1602): Bea (female), airport employee (male)
- **63-4 · Bad at Soccer** (#1603): Eddy (male), Júnior (male), Lucía (female)
- **64-1 · Can You Give Me the Recipe?** (#1604): Bea (female), Vikram (male), baker (male)
- **64-2 · On the News** (#1605): Júnior (male), Lili (female), Zari (female), man Zari tries to help cross the street (male), reporter (male)
- **64-3 · Let's Save the Animals!** (#1606): Gonzalo (male), Lili (female), Óscar (male)
- **64-4 · Junior's New Business** (#1607): Eddy (male), Júnior (male), Bea (female)
- **65-1 · Too Many Things** (#1608): Lin (female), Lucía (female), Mei (female)
- **65-2 · The Secret Place** (#1609): Eddy (male), Júnior (male), Lili (female), Zari (female), Bea (female), Lucía (female)
- **65-3 · Eddy's Tears** (#1610): Eddy (male), Vikram (male)
- **65-4 · I'm Fine!** (#1611): Gilberto (male), Lin (female), Lucía (female)
- **66-1 · Surprise Party** (#1612): Lili (female), Zari (female), Priti (female), Vikram (male)
- **66-2 · The Principal's Office** (#1613): Eddy (male), Júnior (male), Principal Fernández (female)
- **66-3 · Is She Mad at Me?** (#1614): Lili (female), Zari (female), Amanda (female)
- **66-4 · Some Very Tasty Cookies** (#1615): Eddy (male), Júnior (male), Vikram (male)
- **67-1 · Dating Apps** (#1616): Eddy (male), Bea (female)
- **67-2 · My Horse Hates Me** (#1617): Lili (female), Zari (female), El abuelo de Carmen (male)
- **67-3 · The Videotape** (#1618): Eddy (male), Júnior (male), Lili (female), Bea (female), Lucía (female)
- **67-4 · Remove This Statue** (#1619): Lili (female), Zari (female), school principal (male)
- **68-1 · What Are You Wearing?** (#1620): photographer (male), Bea (female), Lin (female), Mimi Ma (female)
- **68-2 · The Mountain** (#1621): teacher (unknown), Sergio (male), Júnior (male), classmate (unknown)
- **68-3 · A Difficult Person** (#1622): Andrés (male), Priti (female), Vikram (male)
- **68-4 · Pirate World** (#1623): Lili (female), Zari (female), Abel's parrot (unnamed) (female), Abel (male)
- **69-1 · I Can Predict the Future** (#1624): Bea (female), Lin (female)
- **69-2 · Uncle Edward's House** (#1625): Eddy (male), Júnior (male)
- **69-3 · Get Out of Here!** (#1626): Pierre (male), Raúl (male), Lin (female), Lucía (female), violinist (male), café owner (male)
- **69-4 · My Card Is Suspended?** (#1627): librarian (female), Lili (female), Zari (female)
- **69-5 · Painting at Sunrise** (#1628): picnicking family member (unknown), tourist (unknown), Lin (female), Óscar (male), hiker (female)
- **69-6 · A Relaxing Weekend** (#1629): Priti (female), Vikram (male), receptionist (female)
- **69-7 · A Walk in Nature** (#1630): Lili (female), Zari (female)
