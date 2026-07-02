import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import path from "node:path";

const port = Number(process.env.PORT ?? 8787);
const root = process.cwd();

const contentTypes: Record<string, string> = {
  ".json": "application/json; charset=utf-8",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

function resolveRequestPath(url: string | undefined) {
  const parsed = new URL(url ?? "/", `http://localhost:${port}`);
  const decodedPath = decodeURIComponent(parsed.pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, normalizedPath);
  if (!filePath.startsWith(root)) return undefined;
  return filePath;
}

createServer((request, response) => {
  const filePath = resolveRequestPath(request.url);
  if (!filePath) {
    response.writeHead(400).end("Bad request");
    return;
  }

  let stats;
  try {
    stats = statSync(filePath);
  } catch {
    response.writeHead(404).end("Not found");
    return;
  }

  if (!stats.isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }

  const contentType = contentTypes[path.extname(filePath)] ?? "application/octet-stream";
  const range = request.headers.range;

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      response.writeHead(416, { "Content-Range": `bytes */${stats.size}` }).end();
      return;
    }

    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : stats.size - 1;
    if (start >= stats.size || end >= stats.size || start > end) {
      response.writeHead(416, { "Content-Range": `bytes */${stats.size}` }).end();
      return;
    }

    response.writeHead(206, {
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${stats.size}`,
      "Content-Type": contentType,
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath, { start, end }).pipe(response);
    console.log(`${request.method} ${request.url} 206 ${start}-${end}`);
    return;
  }

  response.writeHead(200, {
    "Accept-Ranges": "bytes",
    "Content-Length": stats.size,
    "Content-Type": contentType,
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(filePath).pipe(response);
  console.log(`${request.method} ${request.url} 200`);
}).listen(port, "0.0.0.0", () => {
  console.log(`Serving local story audio at http://0.0.0.0:${port}`);
});
