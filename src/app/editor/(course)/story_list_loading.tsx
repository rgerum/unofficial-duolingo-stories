import styles from "./edit_list.module.css";
import { storyListSkeletonIllustrationClassName } from "./story_list_layout";
import StoryListToolbar from "./story_list_toolbar";

const SKELETON_ROWS = Array.from({ length: 8 }, (_, index) => index);

export default function StoryListLoading() {
  return (
    <div className="max-[975px]:px-3 max-[975px]:pt-3 max-[975px]:text-[14px]">
      <StoryListToolbar loading />
      <div className={styles.storyList} role="status">
        <span className="sr-only">Loading stories…</span>
        <div aria-hidden="true">
          {SKELETON_ROWS.map((row) => (
            <div
              className={`${styles.row} ${row % 2 === 1 ? "bg-[var(--body-background-faint)]" : ""}`}
              key={row}
            >
              <div className={styles.setCell}>
                <div className="h-4 w-10 animate-pulse rounded bg-[var(--header-border)]" />
              </div>
              <div className={styles.imageCell}>
                <div className={storyListSkeletonIllustrationClassName} />
              </div>
              <div className={styles.titleCell}>
                <div className="h-4 w-[min(12rem,75%)] animate-pulse rounded bg-[var(--header-border)]" />
                <div className="mt-2 h-3 w-[min(10rem,65%)] animate-pulse rounded bg-[var(--header-border)] max-[975px]:block min-[976px]:hidden" />
              </div>
              <div className={styles.secondaryCell}>
                <div className={styles.statusCell}>
                  <div className="ml-auto h-8 w-16 animate-pulse rounded-full bg-[var(--header-border)]" />
                </div>
                <div className={styles.metadataGroup}>
                  <div className={styles.metadataCell}>
                    <div className="h-4 w-20 animate-pulse rounded bg-[var(--header-border)]" />
                  </div>
                  <div className={styles.metadataCell}>
                    <div className="h-4 w-20 animate-pulse rounded bg-[var(--header-border)]" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
