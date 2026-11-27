import Link from "next/link";
import DocsSearch from "../DocsSearch";
import type { DocsSearchIndex } from "../DocsSearch/docs_search_index";
import {
  docsHeaderBarClass,
  docsHeaderInnerClass,
  docsHeaderLogoClass,
} from "../Docs/docsClasses";

function DocsHeader({ searchIndex }: { searchIndex: DocsSearchIndex }) {
  return (
    <div className={docsHeaderBarClass}>
      <div className={docsHeaderInnerClass}>
        <div className={docsHeaderLogoClass}>
          <Link href="/">Duostories</Link>
        </div>
        <DocsSearch index={searchIndex} />
      </div>
    </div>
  );
}

export default DocsHeader;
