import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_REPO_TOKEN });

async function uploadWithDiffToGithub(
  repository: string,
  content: string | undefined,
  dst: string,
  authorName: string,
  authorEmail: string,
  gitMessage: string,
): Promise<void> {
  let file_sha: string | undefined;
  try {
    // get the current SHA of the file
    const { data } = await octokit.repos.getContent({
      owner: repository.split("/")[0],
      repo: repository.split("/")[1],
      path: dst,
    });
    // data can be array (directory) or file object
    if (!Array.isArray(data) && "sha" in data) {
      file_sha = data.sha;
    }
  } catch (e) {
    // File doesn't exist yet, which is fine
  }

  // create a new commit with updated content
  const author = {
    name: authorName,
    email: authorEmail,
  };

  if (!content) {
    // we cannot delete a non existing file
    if (!file_sha) return;
    await octokit.repos.deleteFile({
      owner: repository.split("/")[0],
      repo: repository.split("/")[1],
      path: dst,
      message: gitMessage,
      sha: file_sha,
      committer: author,
      author: author,
    });
    return;
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

export async function upload_github(
  id: number,
  course_id: number,
  content: string | undefined,
  username: string,
  message: string,
  del: boolean = false,
): Promise<void> {
  // only when the env variable is set (e.g. not in debug mode)
  if (!process.env.GITHUB_REPO_TOKEN) return;

  if (del) {
    await uploadWithDiffToGithub(
      "rgerum/unofficial-duolingo-stories-content",
      undefined,
      `${course_id}/${id}.txt`,
      `${username}`,
      `${username}@carex.uberspace.de`,
      message,
    );
  } else {
    await uploadWithDiffToGithub(
      "rgerum/unofficial-duolingo-stories-content",
      content,
      `${course_id}/${id}.txt`,
      `${username}`,
      `${username}@carex.uberspace.de`,
      message,
    );
  }
}
