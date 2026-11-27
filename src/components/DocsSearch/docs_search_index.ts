/**
 * Search index for the documentation. Built on the server from the MDX
 * sources and searched in the browser, so it holds plain text only.
 */

export type DocsSearchSection = {
  /** Unique within the index, used as the command value. */
  id: string;
  /** The page's path below /docs, like "story-editing/overview". */
  slug: string;
  /** The heading's anchor on the page, or null for the page itself. */
  anchor: string | null;
  /** The section heading, or null for the text before the first heading. */
  heading: string | null;
  text: string;
};

export type DocsSearchPage = {
  slug: string;
  title: string;
  description: string;
  group: string;
  sections: DocsSearchSection[];
};

export type DocsSearchIndex = DocsSearchPage[];

/** Matches the ids the docs page gives its `###` headings. */
export function headingAnchor(heading: string) {
  return heading.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Reduces MDX to the text a reader sees. */
export function markdownToText(markdown: string) {
  return (
    markdown
      // Images keep their alt text, links their label.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // JSX components like <Info> or <Image src=… />.
      .replace(/<\/?[A-Za-z][^>]*>/g, " ")
      // Emphasis and inline code markers. Underscores stay: the docs use them
      // in identifiers like POINT_TO_PHRASE, not for emphasis.
      .replace(/[*`~]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Splits a page body into sections at its `###` headings. */
export function splitSections(slug: string, body: string): DocsSearchSection[] {
  const sections: DocsSearchSection[] = [];
  let heading: string | null = null;
  let lines: string[] = [];
  let inCode = false;

  function flush() {
    const text = markdownToText(lines.join("\n"));
    if (heading !== null || text) {
      sections.push({
        id: heading === null ? slug : `${slug}#${headingAnchor(heading)}`,
        slug,
        anchor: heading === null ? null : headingAnchor(heading),
        heading,
        text,
      });
    }
    lines = [];
  }

  for (const line of body.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    const match = inCode ? null : line.match(/^###\s+(.*)$/);
    if (match) {
      flush();
      heading = markdownToText(match[1]);
      continue;
    }
    // Deeper headings stay part of their section, without the markers.
    lines.push(inCode ? line : line.replace(/^#{4,6}\s+/, ""));
  }
  flush();
  return sections;
}

export type DocsSearchSourcePage = {
  slug: string;
  title: string;
  description?: string;
  group: string;
  body: string;
};

export function buildDocsSearchIndex(
  pages: DocsSearchSourcePage[],
): DocsSearchIndex {
  return pages.map((page) => ({
    slug: page.slug,
    title: page.title,
    description: page.description ?? "",
    group: page.group,
    sections: splitSections(page.slug, page.body),
  }));
}

export type TextPart = { text: string; match: boolean };

export type DocsSearchHit = {
  section: DocsSearchSection;
  /** The heading, split where the query matched. */
  heading: TextPart[] | null;
  /** A short excerpt of the section text around the first match. */
  snippet: TextPart[];
};

export type DocsSearchResult = {
  page: DocsSearchPage;
  title: TextPart[];
  /** Matching sections, best first. Empty when only the page title matched. */
  hits: DocsSearchHit[];
  score: number;
};

function queryTerms(query: string) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Splits `text` into parts, marking every occurrence of any term. */
export function markTerms(text: string, terms: string[]): TextPart[] {
  if (!terms.length) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const marked = new Array<boolean>(text.length).fill(false);
  for (const term of terms) {
    let from = lower.indexOf(term);
    while (from !== -1) {
      marked.fill(true, from, from + term.length);
      from = lower.indexOf(term, from + term.length);
    }
  }
  const parts: TextPart[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.match === marked[i]) last.text += text[i];
    else parts.push({ text: text[i], match: marked[i] });
  }
  return parts;
}

const SNIPPET_BEFORE = 40;
const SNIPPET_LENGTH = 140;

function snippet(text: string, terms: string[]): TextPart[] {
  const lower = text.toLowerCase();
  const first = Math.min(
    ...terms.map((term) => lower.indexOf(term)).filter((i) => i !== -1),
  );
  let start = Number.isFinite(first) ? Math.max(0, first - SNIPPET_BEFORE) : 0;
  // Start at a word boundary.
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space !== -1 && space < first) start = space + 1;
  }
  let end = Math.min(text.length, start + SNIPPET_LENGTH);
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > start) end = space;
  }
  const excerpt =
    (start > 0 ? "… " : "") +
    text.slice(start, end) +
    (end < text.length ? " …" : "");
  return markTerms(excerpt, terms);
}

function wordStartBonus(text: string, term: string) {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(term)}`, "iu").test(text)
    ? 1
    : 0;
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Scores how well `text` matches all terms; 0 when a term is missing. */
function fieldScore(text: string, terms: string[], weight: number) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (!lower.includes(term)) return 0;
    score += weight * (1 + wordStartBonus(text, term));
  }
  return score;
}

const MAX_HITS_PER_PAGE = 4;

/**
 * Finds the pages and sections that contain every word of the query,
 * case-insensitively. Titles rank above headings, headings above body text.
 */
export function searchDocs(
  index: DocsSearchIndex,
  query: string,
): DocsSearchResult[] {
  const terms = queryTerms(query);
  if (!terms.length) return [];

  const results: DocsSearchResult[] = [];
  for (const page of index) {
    const titleScore = fieldScore(page.title, terms, 100);
    const hits: (DocsSearchHit & { score: number })[] = [];
    for (const section of page.sections) {
      const heading = section.heading ?? "";
      const all = `${page.title} ${heading} ${section.text}`;
      // Every term has to appear somewhere in the section or its page title.
      if (fieldScore(all, terms, 1) === 0) continue;
      // Each term scores on its own, since the rest may be in the page title.
      const score = terms.reduce(
        (sum, term) =>
          sum +
          fieldScore(heading, [term], 30) +
          (section.text.toLowerCase().includes(term) ? 5 : 0),
        0,
      );
      // Sections that only match through the page title add nothing.
      if (score === 0) continue;
      hits.push({
        section,
        score,
        heading: section.heading ? markTerms(section.heading, terms) : null,
        snippet: snippet(section.text, terms),
      });
    }
    if (!titleScore && !hits.length) continue;
    hits.sort((a, b) => b.score - a.score);
    results.push({
      page,
      title: markTerms(page.title, terms),
      hits: hits.slice(0, MAX_HITS_PER_PAGE).map(({ score: _, ...hit }) => hit),
      score: titleScore + (hits[0]?.score ?? 0),
    });
  }
  return results.sort((a, b) => b.score - a.score);
}

export function sectionHref(section: DocsSearchSection) {
  return `/docs/${section.slug}${section.anchor ? `#${section.anchor}` : ""}`;
}
