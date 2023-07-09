import query from "./db";


export async function update_query(table_name, data) {
    let values = [];
    let updates = [];
    for(let key in data) {
        values.push(data[key]);
        updates.push(`${key} = ?`);
    }
    values.push(data.id);
    let update_string = updates.join(", ");
    const user_new = await query(`UPDATE ${table_name}
                            SET ${update_string}
                            WHERE id = ?
                            LIMIT 1;`, values);
    return user_new;
}


export async function insert_query(table_name, data) {
    let values = [];
    let columns = [];
    let value_placeholders = [];
    for(let key in data) {
        values.push(data[key]);
        columns.push(`${key}`);
        value_placeholders.push(`?`);
    }
    let columns_string = columns.join(", ");
    let value_placeholders_string = value_placeholders.join(", ");
    const user_new = await query(`INSERT INTO ${table_name}
                            (${columns_string})
                            VALUES (${value_placeholders_string}) ;`, values);
    const id = user_new.insertId;
    return id;
}