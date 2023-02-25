import query from "../../../lib/db";

export default async (req, res) => {
    try {
        console.log("call")
        let ret = await activate(req.body);
        console.log("call", ret)
        if(ret?.status)
            return res.status(ret.status).send(ret?.message);
        console.log("call end")
        return res.json(ret);//
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function check_username(username, existing) {
    let result = await query("SELECT id, email FROM user WHERE LOWER(username) = LOWER(?)", [username]);
    console.log("check_username->result", result, username, existing)
    if(existing) {
        if(result.length) {
            return result[0];
        }
        return {status: 403, message: "Error username does not exists"};
    }
    else {
        if(result.length) {
            return {status: 403, message: "Error username already exists"};
        }
        return true;
    }
}

export async function activate({username, hash}) {

    // check username
    let username_check = await check_username(username, true);
    if(username_check?.status)
        return username_check
    let result = await query("UPDATE user SET activated = 1 WHERE username = ? AND activation_link = ?;", [username, hash]);

    if(result.affectedRows)
        return "done";
    return {status: 403, message:"Username or activation link do not exist."}
}