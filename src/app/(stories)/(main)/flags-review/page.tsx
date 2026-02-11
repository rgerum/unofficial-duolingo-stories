import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import styles from "./flags-review.module.css";

type Row = {
  name: string;
  before: number;
  after: number;
  saved: number;
  savedPct: number;
  beforeSrc: string;
  afterSrc: string;
};

function formatBytes(value: number) {
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function getRows() {
  const flagsDir = path.join(process.cwd(), "flags");
  const names = (await readdir(flagsDir))
    .filter((name) => name.endsWith(".svg"))
    .sort((a, b) => a.localeCompare(b));

  const rows: Row[] = [];

  for (const name of names) {
    const afterSvg = await readFile(path.join(flagsDir, name), "utf8");
    const beforeSvg = execFileSync("git", ["show", `HEAD:flags/${name}`], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    const after = Buffer.byteLength(afterSvg, "utf8");
    const before = Buffer.byteLength(beforeSvg, "utf8");
    const saved = Math.max(0, before - after);
    const savedPct = before > 0 ? (saved / before) * 100 : 0;
    rows.push({
      name,
      before,
      after,
      saved,
      savedPct,
      beforeSrc: svgToDataUri(beforeSvg),
      afterSrc: svgToDataUri(afterSvg),
    });
  }

  rows.sort((a, b) => b.saved - a.saved || b.savedPct - a.savedPct);
  return rows;
}

export default async function FlagsReviewPage() {
  const rows = await getRows();
  const totalBefore = rows.reduce((sum, row) => sum + row.before, 0);
  const totalAfter = rows.reduce((sum, row) => sum + row.after, 0);
  const totalSaved = totalBefore - totalAfter;
  const totalSavedPct = totalBefore > 0 ? (totalSaved / totalBefore) * 100 : 0;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Flags SVG Before/After Review</h1>
      <p className={styles.subtitle}>
        Sorted by bytes saved. Compare visual output before finalizing the optimization.
      </p>

      <section className={styles.summary}>
        <div className={styles.summaryBox}>
          <div className={styles.summaryLabel}>Files</div>
          <div className={styles.summaryValue}>{rows.length}</div>
        </div>
        <div className={styles.summaryBox}>
          <div className={styles.summaryLabel}>Before</div>
          <div className={styles.summaryValue}>{formatBytes(totalBefore)}</div>
        </div>
        <div className={styles.summaryBox}>
          <div className={styles.summaryLabel}>After</div>
          <div className={styles.summaryValue}>{formatBytes(totalAfter)}</div>
        </div>
        <div className={styles.summaryBox}>
          <div className={styles.summaryLabel}>Saved</div>
          <div className={styles.summaryValue}>
            {formatBytes(totalSaved)} ({totalSavedPct.toFixed(1)}%)
          </div>
        </div>
      </section>

      <section className={styles.list}>
        {rows.map((row) => (
          <article key={row.name} className={styles.item}>
            <header className={styles.itemHeader}>
              <span className={styles.name}>{row.name}</span>
              <div className={styles.stats}>
                <span>saved {formatBytes(row.saved)}</span>
                <span>{row.savedPct.toFixed(1)}%</span>
                <span>
                  {formatBytes(row.before)} → {formatBytes(row.after)}
                </span>
              </div>
            </header>

            <div className={styles.views}>
              <div className={styles.view}>
                <h2 className={styles.viewTitle}>Before (HEAD)</h2>
                <div className={styles.imageWrap}>
                  <img
                    className={styles.image}
                    src={row.beforeSrc}
                    alt={`Before ${row.name}`}
                    loading="lazy"
                  />
                </div>
              </div>
              <div className={styles.view}>
                <h2 className={styles.viewTitle}>After (optimized)</h2>
                <div className={styles.imageWrap}>
                  <img
                    className={styles.image}
                    src={row.afterSrc}
                    alt={`After ${row.name}`}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
