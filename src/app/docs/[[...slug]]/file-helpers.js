import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

export async function getBlogPostList() {
  const fileNames = await readDirectory("/content");

  const blogPosts = [];

  for (let fileName of fileNames) {
    const rawContent = await readFile(`/content/${fileName}`);

    const { data: frontmatter } = matter(rawContent);

    blogPosts.push({
      slug: fileName.replace(".mdx", ""),
      ...frontmatter,
    });
  }

  return blogPosts.sort((p1, p2) => (p1.publishedOn < p2.publishedOn ? 1 : -1));
}

export async function loadBlogPost(slug) {
  const rawContent = await readFile(`/content/${slug}.mdx`);

  const { data: frontmatter, content } = matter(rawContent);

  return { frontmatter, content };
}

function readFile(localPath) {
  return fs.readFile(path.join(process.cwd(), localPath), "utf8");
}

function readDirectory(localPath) {
  return fs.readdir(path.join(process.cwd(), localPath));
}
