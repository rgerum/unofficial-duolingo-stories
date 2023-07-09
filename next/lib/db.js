if(!process.env.NEXTAUTH_URL) {
    const sqlite3 = require('sqlite3').verbose();

    // Create a new in-memory database
    //const db = new sqlite3.Database(':memory:');
    const db = new sqlite3.Database('test.sql');

    async function query(row, params) {
        return new Promise((resolve, reject) => {
           db.all(row, params, (err, rows) => {
                if(err)
                    reject(err);
                else
                    resolve(rows);
           });
        });
    }

    async function insert(table_name, data, mapping) {
        let values = [];
        let columns = [];
        let value_placeholders = [];
        for (let key in data) {
            if (mapping[key]) {
                values.append(data[key]);
                columns.push(`${mapping[key]}`);
                value_placeholders.push(`?`);
            }
        }
        let columns_string = columns.join(", ");
        let value_placeholders_string = value_placeholders.join(", ");
        await query(`INSERT INTO ${table_name}
                            (${columns_string})
                            VALUES (${value_placeholders_string}) ;`, values);
    }

    async function update(table_name, data) {
        let values = [];
        let updates = [];
        for(let key in data) {
            values.push(data[key]);
            updates.push(`${key} = ?`);
        }
        values.push(data.id);
        let update_string = updates.join(", ");
        console.log(`UPDATE ${table_name}
                            SET ${update_string}
                            WHERE id = ?;`, values)
        return await query(`UPDATE ${table_name}
                            SET ${update_string}
                            WHERE id = ?
                            ;`, values);
    }


    module.exports = query;
    module.exports.insert = insert;
    module.exports.update = update;
}
else {
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
        return new Promise(function (resolve, reject) {
            connection.query(query, args, (err, res) => {
                if (err) {
                    console.log("err", err);
                    reject(err);
                }
                resolve(res);
            });
        });
    }

    async function update(table_name, data, mapping) {
        let values = [];
        let updates = [];
        for (let key in data) {
            if(mapping.includes && mapping.includes(key)) {
                values.push(data[key]);
                updates.push(`${key} = ?`);
            }
            else if (mapping[key]) {
                values.push(data[key]);
                updates.push(`${mapping[key]} = ?`);
            }
        }
        let update_string = updates.join(", ");
        values.push(data["id"])
        return await query(`UPDATE ${table_name} SET ${update_string} WHERE id = ?;`, values);
    }

    async function insert(table_name, data, mapping) {
        console.log("insert", table_name, data, mapping);
        let values = [];
        let columns = [];
        let value_placeholders = [];
        for (let key in data) {
            if(mapping.includes && mapping.includes(key)) {
                values.push(data[key]);
                columns.push(`${key}`);
                value_placeholders.push(`?`);
            }
            else if (mapping[key]) {
                values.push(data[key]);
                columns.push(`${mapping[key]}`);
                value_placeholders.push(`?`);
            }
        }
        let columns_string = columns.join(", ");
        let value_placeholders_string = value_placeholders.join(", ");
        await query(`INSERT INTO ${table_name}
                            (${columns_string})
                            VALUES (${value_placeholders_string})
                            LIMIT 1;`, values);
    }

    module.exports = query;
    module.exports.insert = insert;
    module.exports.update = update;
}