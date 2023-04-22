async function github_request(method, url, headers = {}, data = null, params = null) {
    const apiUrl = "https://api.github.com" + url;
    headers = {
        ...headers,
        "User-Agent": "Agent 007",
        "Authorization": "Bearer " + process.env.GITHUB_REPO_TOKEN,
    };

    let urlPath = new URL(apiUrl).pathname;
    if (params) {
        urlPath += "?" + new URLSearchParams(params).toString();
    }

    let response = await fetch(apiUrl, {
        method,
        headers,
        body: data && JSON.stringify(data),
    });

    if (response.status === 302) {
        return github_request(method, response.headers.get("Location"));
    }

    if (response.status >= 400) {
        headers.Authorization = "";
        console.log("error0", response)
        throw new Error(
            `Error: ${response.status} - ${JSON.stringify(await response.json())} - ${method} - ${apiUrl} - ${JSON.stringify(data)} - ${JSON.stringify(headers)}`
        );
    }

    return [response, await response.json()];
}

async function upload_to_github(repository, src, dst, author_name, author_email, git_message, content, branch="heads/main") {
    // Get last commit SHA of a branch
    const [resp1, jeez1] = await github_request("GET", `/repos/${repository}/git/ref/${branch}`);
    const last_commit_sha = jeez1.object.sha;
    console.log("Last commit SHA: " + last_commit_sha);

    const base64content = Buffer.from(content).toString('base64');
    const [resp2, jeez2] = await github_request("POST", `/repos/${repository}/git/blobs`, {}, {
        content: base64content,
        encoding: "base64"
    });
    const blob_content_sha = jeez2.sha;

    const [resp3, jeez3] = await github_request("POST", `/repos/${repository}/git/trees`, {}, {
        base_tree: last_commit_sha,
        tree: [{
            path: dst,
            mode: "100644",
            type: "blob",
            sha: blob_content_sha
        }]
    });
    const tree_sha = jeez3.sha;

    const [resp4, jeez4] = await github_request("POST", `/repos/${repository}/git/commits`, {}, {
        message: git_message,
        author: {
            name: author_name,
            email: author_email
        },
        parents: [last_commit_sha],
        tree: tree_sha
    });
    const new_commit_sha = jeez4.sha;

    const [resp5, jeez5] = await github_request("PATCH", `/repos/${repository}/git/refs/${branch}`, {}, {
        sha: new_commit_sha
    });
    return [resp5, jeez5];
}

async function delete_from_github(repository, src, dst, author_name, author_email, git_message, branch = "heads/main") {
    // Get last commit SHA of a branch
    const [resp, jeez] = await github_request("GET", `/repos/${repository}/git/ref/${branch}`);
    const last_commit_sha = jeez.object.sha;
    console.log("Last commit SHA: " + last_commit_sha);

    const [getResp, getJeez] = await github_request(
        "GET",
        `/repos/${repository}/contents/${dst}`
    );
    const tree_sha = getJeez.sha;

    const [deleteResp, deleteJeez] = await github_request(
        "DELETE",
        `/repos/${repository}/contents/${dst}`,
        {}, {
            message: git_message,
            author: {
                name: author_name,
                email: author_email,
            },
            committer: {
                name: author_name,
                email: author_email,
            },
            parents: [last_commit_sha],
            sha: tree_sha,
        }
    );
    const new_commit_sha = deleteJeez.commit.sha;

    const [patchResp, patchJeez] = await github_request(
        "PATCH",
        `/repos/${repository}/git/refs/${branch}`,
        {}, { sha: new_commit_sha }
    );
    return [patchResp, patchJeez];
}


async function upload_github(id, course_id, content, username, message, del=false) {

    if(del) {
        await delete_from_github("rgerum/unofficial-duolingo-stories-content", `${id}.txt`, `${course_id}/${id}.txt`, `${username}`, `${username}@carex.uberspace.de`, message);
    }
    else {
        await upload_to_github("rgerum/unofficial-duolingo-stories-content", `${id}.txt`, `${course_id}/${id}.txt`, `${username}`, `${username}@carex.uberspace.de`, message, content);
    }
}

module.exports = {upload_github: upload_github}