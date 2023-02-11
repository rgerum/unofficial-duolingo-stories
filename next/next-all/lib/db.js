const mysql = require("mysql");
const dbConfig = require("./db.config.js");


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

export async function update(table_name, data, mapping) {
    let values = [];
    let updates = [];
    for(let key in data) {
        if(mapping[key]) {
            values.append(data[key]);
            updates.push(`${mapping[key]} = ?`);
        }
    }
    updates.push(data.id);
    let update_string = updates.join(", ");
    const user_new = await query(`UPDATE ${table_name}
                            SET ${update_string}
                            WHERE id = ?
                            LIMIT 1;`, values);
}

export async function insert(table_name, data, mapping) {
    console.log("insert", table_name, data, mapping);
    let values = [];
    let columns = [];
    let value_placeholders = [];
    for(let key in data) {
        if(mapping[key]) {
            values.append(data[key]);
            columns.push(`${mapping[key]}`);
            value_placeholders.push(`?`);
        }
    }
    let columns_string = columns.join(", ");
    let value_placeholders_string = value_placeholders.join(", ");
    console.log("insert", `INSERT INTO ${table_name}
                            (${columns_string})
                            VALUES (${value_placeholders_string})
                            LIMIT 1;`, values)
    const user_new = await query(`INSERT INTO ${table_name}
                            (${columns_string})
                            VALUES (${value_placeholders_string})
                            LIMIT 1;`, values);
}
module.exports = query;
