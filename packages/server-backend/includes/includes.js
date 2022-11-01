const query = require("./db");

function func_catch(func) {
    return async (req, res) => {
        try {
            let data = await func({...req.params, ...req.body}, req.session);
            if(data?.status) {
                return res.status(data.status).json(data?.message);
            }
            else if(data === undefined) {
                return res.status(404).json({});
            }
            else
                res.json(data);
        }
        catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

async function update_query(table, data, names, id_key="id") {
    if(data[id_key] === undefined)
        return insert_query(table, data, names);
    let query_parts = [];
    let arguments = [];
    for(let name of names) {
        if(name !== id_key) {
            query_parts.push(`${name}=?`);
            arguments.push(data[name]);
        }
    }
    arguments.push(data[id_key]);
    return await query(`UPDATE ${table} SET ${query_parts.join(', ')} WHERE ${id_key} = ?;`, arguments);
}

async function insert_query(table, data, names) {
    let query_parts = [];
    let values = [];
    let arguments = [];
    for(let name of names) {
        query_parts.push(`${name}`);
        values.push("?");
        arguments.push(data[name]);
    }
    return await query(`INSERT INTO ${table} (${query_parts.join(', ')}) VALUES (${values.join(", ")});`, arguments);
}

module.exports = {func_catch: func_catch, update_query: update_query, insert_query: insert_query};
