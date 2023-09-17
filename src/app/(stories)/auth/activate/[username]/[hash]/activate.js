import query from "lib/db";


async function check_username(username, existing) {
    let result = await query("SELECT id, email FROM user WHERE LOWER(username) = LOWER(?)", [username]);

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
    // activate the user
    await query("UPDATE user SET activated = 1 WHERE username = ? AND activation_link = ?;", [username, hash]);

    // check if it was set correctly
    let result2 = await query("SELECT activated FROM user WHERE username = ? AND activation_link = ?;", [username, hash]);

    if(result2[0].activated)
        return "done";
    return {status: 403, message:"Username or activation link do not exist."}
}