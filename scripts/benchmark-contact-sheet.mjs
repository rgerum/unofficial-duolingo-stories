#!/usr/bin/env node
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const registry = JSON.parse(
  await readFile(
    path.join(rootDir, "app-mobile/src/debug-benchmark/cases.json"),
    "utf8",
  ),
);
const args = process.argv.slice(2);
const screenshotDir = path.resolve(args[0] ?? path.join(rootDir, "benchmark-shots"));
const stampArgIndex = args.indexOf("--stamp");
const stamp =
  stampArgIndex >= 0 && args[stampArgIndex + 1]
    ? args[stampArgIndex + 1]
    : new Date().toISOString();

await mkdir(screenshotDir, { recursive: true });

const grouped = registry.cases.reduce((groups, entry) => {
  groups[entry.group] ??= [];
  groups[entry.group].push(entry);
  return groups;
}, {});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function imageCell(platform, id) {
  const relative = `${platform}/${id}.png`;
  const fullPath = path.join(screenshotDir, relative);
  try {
    await stat(fullPath);
    const href = relative.split(path.sep).map(encodeURIComponent).join("/");
    return `<a class="shot" href="${href}"><img src="${href}" alt="${escapeHtml(platform)} ${escapeHtml(id)}"></a>`;
  } catch {
    return `<div class="missing">not captured</div>`;
  }
}

const sections = [];
for (const [group, entries] of Object.entries(grouped)) {
  const rows = [];
  for (const entry of entries) {
    rows.push(`
      <tr>
        <th scope="row">
          <div class="case-id">${escapeHtml(entry.id)}</div>
          <div class="note">${escapeHtml(entry.note)}</div>
        </th>
        <td>${await imageCell("android", entry.id)}</td>
        <td>${await imageCell("ios", entry.id)}</td>
      </tr>
    `);
  }
  sections.push(`
    <section>
      <h2>${escapeHtml(group)}</h2>
      <table>
        <thead>
          <tr>
            <th>Case</th>
            <th>Android</th>
            <th>iOS</th>
          </tr>
        </thead>
        <tbody>${rows.join("\n")}</tbody>
      </table>
    </section>
  `);
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mobile Rendering Benchmark</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f7f7f7;
      --surface: #ffffff;
      --text: #2f2f2f;
      --muted: #6f6f6f;
      --border: #dedede;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #131f22;
        --surface: #202f36;
        --text: #f1f7fb;
        --muted: #c7d1d8;
        --border: #37464f;
      }
    }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header, footer {
      padding: 18px 22px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
    }
    h2 {
      margin: 24px 0 10px;
      padding: 0 22px;
      font-size: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--surface);
      border-block: 1px solid var(--border);
    }
    th, td {
      border-top: 1px solid var(--border);
      padding: 10px;
      vertical-align: top;
    }
    thead th {
      color: var(--muted);
      font-weight: 700;
      text-align: left;
    }
    tbody th {
      width: 240px;
      text-align: left;
      font-weight: 400;
    }
    .case-id {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-weight: 700;
    }
    .note {
      color: var(--muted);
      margin-top: 4px;
    }
    .shot {
      display: inline-block;
    }
    img {
      display: block;
      width: min(360px, 100%);
      max-width: 360px;
      height: auto;
      border: 1px solid var(--border);
      background: #000;
    }
    .missing {
      width: min(360px, 100%);
      max-width: 360px;
      min-height: 220px;
      display: grid;
      place-items: center;
      color: var(--muted);
      background: color-mix(in srgb, var(--muted) 12%, transparent);
      border: 1px dashed var(--border);
      box-sizing: border-box;
    }
    footer {
      color: var(--muted);
    }
  </style>
</head>
<body>
  <header>
    <h1>Mobile Rendering Benchmark</h1>
  </header>
  ${sections.join("\n")}
  <footer>Generated ${escapeHtml(stamp)}</footer>
</body>
</html>
`;

await writeFile(path.join(screenshotDir, "index.html"), html);
