const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('test.sqlite');

db.exec('DELETE FROM user WHERE username = "user_new"')
