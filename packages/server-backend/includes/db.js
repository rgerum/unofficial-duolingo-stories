const mysql = require("mysql");
const dbConfig = require("./../config/db.config.js");


// Create a connection to the database
const connection = mysql.createConnection({
    host: dbConfig.HOST,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
    database: dbConfig.DB
});

// open the MySQL connection
connection.connect(error => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
});

async function query(query, args) {
    return new Promise(function(resolve, reject) {
        connection.query(query, args, (err, res) => {
            if (err) {
                console.log("err", err);
                reject(err);
            }
            resolve(res);
        });
    });
}
module.exports = query;
