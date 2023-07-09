const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_REPO_TOKEN });

async function uploadWithDiffToGithub(repository, content, dst, authorName, authorEmail, gitMessage, branch = "heads/main") {
    let file_sha;
    try {
        // get the current SHA of the file
        const {data: {sha}} = await octokit.repos.getContent({
            owner: repository.split("/")[0],
            repo: repository.split("/")[1],
            path: dst,
        });
        file_sha = sha;
    }
    catch (e) {}

    // create a new commit with updated content
    const author = {
        name: authorName,
        email: authorEmail,
    };

    if(!content) {
        // we cannot delete a non existing file
        if(!file_sha)
            return
        await octokit.repos.deleteFile({
            owner: repository.split("/")[0],
            repo: repository.split("/")[1],
            path: dst,
            message: gitMessage,
            sha: file_sha,
            committer: author,
            author: author,
        })
    }
    await octokit.repos.createOrUpdateFileContents({
        owner: repository.split("/")[0],
        repo: repository.split("/")[1],
        path: dst,
        message: gitMessage,
        content: Buffer.from(content).toString("base64"),
        sha: file_sha,
        committer: author,
        author: author,
    });
}


async function upload_github(id, course_id, content, username, message, del=false) {

    if(del) {
        await uploadWithDiffToGithub("rgerum/unofficial-duolingo-stories-content", undefined, `${course_id}/${id}.txt`, `${username}`, `${username}@carex.uberspace.de`, message);
    }
    else {
       await uploadWithDiffToGithub("rgerum/unofficial-duolingo-stories-content", content, `${course_id}/${id}.txt`, `${username}`, `${username}@carex.uberspace.de`, message);
   }
}

module.exports = {upload_github: upload_github}