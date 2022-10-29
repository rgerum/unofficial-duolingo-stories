import urllib.parse
import http.client
import json
import base64
import sys

with open("token.txt") as fp:
    GITHUB_TOKEN = fp.read().strip()

def github_request(method, url, headers=None, data=None, params=None):
    """Execute a request to the GitHUB API, handling redirect"""
    url = "https://api.github.com" + url
    if not headers:
        headers = {}
    headers.update({
        "User-Agent": "Agent 007",
        "Authorization": "Bearer " + GITHUB_TOKEN,
    })

    url_parsed = urllib.parse.urlparse(url)
    url_path = url_parsed.path
    if params:
        url_path += "?" + urllib.parse.urlencode(params)

    data = data and json.dumps(data)
    conn = http.client.HTTPSConnection(url_parsed.hostname)
    conn.request(method, url_path, body=data, headers=headers)
    response = conn.getresponse()
    if response.status == 302:
        return github_request(method, response.headers["Location"])

    if response.status >= 400:
        headers.pop('Authorization', None)
        raise Exception(
            f"Error: {response.status} - {json.loads(response.read())} - {method} - {url} - {data} - {headers}"
        )

    return (response, json.loads(response.read().decode()))


def upload_to_github(repository, src, dst, author_name, author_email, git_message, branch="heads/main"):
    # Get last commit SHA of a branch
    resp, jeez = github_request("GET", f"/repos/{repository}/git/ref/{branch}")
    last_commit_sha = jeez["object"]["sha"]
    print("Last commit SHA: " + last_commit_sha)

    base64content = base64.b64encode(open(src, "rb").read())
    resp, jeez = github_request(
        "POST",
        f"/repos/{repository}/git/blobs",
        data={
            "content": base64content.decode(),
            "encoding": "base64"
        },
    )
    blob_content_sha = jeez["sha"]

    resp, jeez = github_request(
        "POST",
        f"/repos/{repository}/git/trees",
        data={
            "base_tree":
            last_commit_sha,
            "tree": [{
                "path": dst,
                "mode": "100644",
                "type": "blob",
                "sha": blob_content_sha,
            }],
        },
    )
    tree_sha = jeez["sha"]

    resp, jeez = github_request(
        "POST",
        f"/repos/{repository}/git/commits",
        data={
            "message": git_message,
            "author": {
                "name": author_name,
                "email": author_email,
            },
            "parents": [last_commit_sha],
            "tree": tree_sha,
        },
    )
    new_commit_sha = jeez["sha"]

    resp, jeez = github_request(
        "PATCH",
        f"/repos/{repository}/git/refs/{branch}",
        data={"sha": new_commit_sha},
    )
    return (resp, jeez)


def delete_from_github(repository, src, dst, author_name, author_email, git_message, branch="heads/main"):
    # Get last commit SHA of a branch
    resp, jeez = github_request("GET", f"/repos/{repository}/git/ref/{branch}")
    last_commit_sha = jeez["object"]["sha"]
    print("Last commit SHA: " + last_commit_sha)

    """
    const { data: { sha } } = await octokit.request('GET /repos/{owner}/{repo}/contents/{file_path}', {
          owner: "owner-name",
          repo: "repo-name",
          file_path: "file-path-with-extension-from-root"
        });
    """

    resp, jeez = github_request(
        "GET",
        f"/repos/{repository}/contents/{dst}",
        data={

        },
    )
    tree_sha = jeez["sha"]

    """
    delete /repos/{owner}/{repo}/contents/{path}

    Parameters
    Name 	Type 	In 	Description
    accept 	string 	header

    Setting to application/vnd.github.v3+json is recommended.
    owner 	string 	path
    repo 	string 	path
    path 	string 	path

    path parameter
    message 	string 	body

    Required. The commit message.
    sha 	string 	body

    Required. The blob SHA of the file being replaced.
    branch 	string 	body

    The branch name. Default: the repository’s default branch (usually master)
    committer 	object 	body

    object containing information about the committer.
    """
    resp, jeez = github_request(
        "DELETE",
        f"/repos/{repository}/contents/{dst}",
        data={
            "message": git_message,
            "author": {
                "name": author_name,
                "email": author_email,
            },
            "committer": {
                "name": author_name,
                "email": author_email,
            },
            "parents": [last_commit_sha],
            "sha": tree_sha,
        },
    )
    new_commit_sha = jeez["commit"]["sha"]

    resp, jeez = github_request(
        "PATCH",
        f"/repos/{repository}/git/refs/{branch}",
        data={"sha": new_commit_sha},
    )
    return (resp, jeez)

if __name__ == "__main__":
    print(sys.argv)
    file = sys.argv[1]
    course = sys.argv[2]
    author = sys.argv[3]
    message = sys.argv[4]
    if len(sys.argv) >= 6:
        command = sys.argv[5]
    else:
        command = "add"
    print("file", file, course, author, "message", message)
    if command == "add":
        upload_to_github("rgerum/unofficial-duolingo-stories-content", f"{file}.txt", f"{course}/{file}.txt", f"{author}", f"{author}@carex.uberspace.de", message)
    else:
        delete_from_github("rgerum/unofficial-duolingo-stories-content", f"{file}.txt", f"{course}/{file}.txt", f"{author}", f"{author}@carex.uberspace.de", message)
    import os
    os.remove(f"{file}.txt")
