# Server Backend

This folder contains the backend written as a [express](https://expressjs.com/) server to be run with [node](https://nodejs.org/en/).
Data is stored in a [mysql](https://www.mysql.com/) database that is interfaced using the mysql javascript package. We use direct queries and 
no ORM (Object–relational mapping) libary is used.
Sessions are stored using a [Redis](https://redis.io/) database managed with the [express-session](https://www.npmjs.com/package/express-session) 
javascript package.
The javascript package nodemailer is used to send out emails for registering users.
