const fs = require('fs/promises');
const { exec } = require("child_process");

function shell_escape(arg) {
    return "'"+`${arg}`.replace(/'/g, "\'")+"'"
}

async function upload_github(id, course_id, content, username, message, del=false) {
    await fs.writeFile(`${id}.txt`, content);

    if(del) {
        exec(`python3 includes/upload_github.py ${shell_escape(id)} ${shell_escape(course_id)} ${shell_escape(username)} ${shell_escape(message)} delete`, (error, stdout, stderr) => {
            if (error) {
                console.log(error);
            }
            if (stderr) {
                console.log(stderr);
            }
            console.log(stdout);
        });
    }
    else {
        exec(`python3 includes/upload_github.py ${shell_escape(id)} ${shell_escape(course_id)} ${shell_escape(username)} ${shell_escape(message)}`, (error, stdout, stderr) => {
            if (error) {
                console.log(error);
            }
            if (stderr) {
                console.log(stderr);
            }
            console.log(stdout);
        });
    }
}

module.exports = {upload_github: upload_github}