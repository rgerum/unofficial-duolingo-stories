import {
  mkdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

type ImageRecord = {
  id: string;
  active: string | null;
  gilded: string | null;
  locked: string | null;
};

type DownloadTask = {
  url: string;
  destination: string;
};

type ManifestEntry = {
  id: string;
  active: string | null;
  gilded: string | null;
  locked: string | null;
};

const DEFAULT_SOURCE = path.join(process.cwd(), "database", "image.json");
const DEFAULT_OUTPUT = path.join(process.cwd(), "database", "story-images");
const DEFAULT_CONCURRENCY = 12;

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function parseArgs() {
  const source = getArgValue("--source") ?? DEFAULT_SOURCE;
  const outDir = getArgValue("--out-dir") ?? DEFAULT_OUTPUT;
  const concurrencyValue = getArgValue("--concurrency");
  const concurrency = concurrencyValue
    ? Math.max(1, Number.parseInt(concurrencyValue, 10))
    : DEFAULT_CONCURRENCY;

  if (!Number.isFinite(concurrency) || concurrency <= 0) {
    throw new Error(`Invalid concurrency value: ${concurrencyValue}`);
  }

  return { source, outDir, concurrency };
}

function fileNameFromUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  const baseName = path.basename(parsed.pathname);
  if (!baseName) {
    throw new Error(`Could not determine filename from URL: ${rawUrl}`);
  }
  return baseName;
}

function isValidHttpUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function fileExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url: string, destination: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const tempPath = `${destination}.tmp`;
  await writeFile(tempPath, buffer);
  await rename(tempPath, destination);
}

async function run() {
  const { source, outDir, concurrency } = parseArgs();
  console.log(`Source: ${source}`);
  console.log(`Output: ${outDir}`);
  console.log(`Concurrency: ${concurrency}`);

  const sourceData = await readFile(source, "utf8");
  const imageRecords = JSON.parse(sourceData) as ImageRecord[];

  await mkdir(outDir, { recursive: true });

  const tasks: DownloadTask[] = [];
  const manifestEntries: ManifestEntry[] = [];
  const uniqueUrls = new Set<string>();
  let skippedInvalidUrlCount = 0;

  for (const record of imageRecords) {
    const variants = {
      active: record.active,
      gilded: record.gilded,
      locked: record.locked,
    } as const;

    const variantToRelativePath: Record<keyof typeof variants, string | null> =
      {
        active: null,
        gilded: null,
        locked: null,
      };

    for (const [variant, url] of Object.entries(variants) as Array<
      [keyof typeof variants, string | null]
    >) {
      if (!isValidHttpUrl(url)) {
        skippedInvalidUrlCount += 1;
        continue;
      }
      const fileName = fileNameFromUrl(url);
      const relativeDestination = path.join("files", fileName);
      const destination = path.join(outDir, relativeDestination);
      variantToRelativePath[variant] = relativeDestination;

      if (uniqueUrls.has(url)) continue;
      uniqueUrls.add(url);

      tasks.push({
        url,
        destination,
      });
    }

    manifestEntries.push({
      id: record.id,
      active: variantToRelativePath.active,
      gilded: variantToRelativePath.gilded,
      locked: variantToRelativePath.locked,
    });
  }

  await mkdir(path.join(outDir, "files"), { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  const failed: Array<{ url: string; reason: string }> = [];
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= tasks.length) return;

      const task = tasks[index];
      const alreadyDownloaded = await fileExists(task.destination);
      if (alreadyDownloaded) {
        skipped += 1;
        continue;
      }

      try {
        await downloadFile(task.url, task.destination);
        downloaded += 1;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        failed.push({ url: task.url, reason });
        await unlink(`${task.destination}.tmp`).catch(() => undefined);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.relative(process.cwd(), source),
    totalImageRecords: imageRecords.length,
    totalUniqueUrls: tasks.length,
    skippedInvalidUrlCount,
    downloaded,
    skipped,
    failedCount: failed.length,
    records: manifestEntries,
  };

  await writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(outDir, "failed.json"),
    JSON.stringify(failed, null, 2),
    "utf8",
  );

  console.log("");
  console.log(`Image records: ${imageRecords.length}`);
  console.log(`Unique URLs: ${tasks.length}`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(`Failed: ${failed.length}`);
  console.log(
    failed.length > 0
      ? `Failure details: ${path.join(outDir, "failed.json")}`
      : "All downloads completed.",
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
