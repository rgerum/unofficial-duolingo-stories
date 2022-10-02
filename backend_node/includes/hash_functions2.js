const { exec } = require("child_process");

function shell_escape(arg) {
    return "'"+arg.replace(/'/g, "\'")+"'"
}

async function phpbb_check_hash(password, hash) {
    return new Promise(function(resolve, reject) {
        exec(`php includes/check_hash.php ${shell_escape(password)} ${shell_escape(hash)}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            if (stderr) {
                reject(stderr);
            }
            resolve(stdout === 'true');
        });
    });
}

async function phpbb_hash(password) {
    return new Promise(function(resolve, reject) {
        exec(`php includes/hash.php ${shell_escape(password)}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            if (stderr) {
                reject(stderr);
            }
            resolve(stdout);
        });
    });
}

module.exports = {phpbb_check_hash: phpbb_check_hash, phpbb_hash: phpbb_hash}
