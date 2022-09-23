const { exec } = require("child_process");

async function phpbb_check_hash(password, hash) {
    return new Promise(function(resolve, reject) {
        exec(`php check_hash.php ${password} '${hash}'`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                reject(stderr);
            }
            console.log(`stdout: ${stdout}`);
            resolve(stdout === 'true');
        });
    });
}

module.exports = phpbb_check_hash
