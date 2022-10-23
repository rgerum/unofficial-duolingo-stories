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
    let query_parts = "";
    for(let name of names) {
        if(name !== id_key)
            query_parts += `${name}=${data[name]} `;
    }
    return await query(`UPDATE ${table} SET ${query_parts} WHERE ${id_key} = ${data[id_key]};`);
}

module.exports = {func_catch: func_catch, update_query: update_query};
