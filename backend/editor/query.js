const mysql = require('mysql');
// carex_stories
var con = mysql.createConnection({
    host: "localhost",
    user: "carex",
    password: "5hfW-18MSXgYvjrewhbP"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});