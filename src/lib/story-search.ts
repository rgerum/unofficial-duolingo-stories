export type StorySearchable = {
  name: string;
  set_id: number;
  set_index: number;
  status?: string;
  public?: boolean;
};

export type StorySearchState = "draft" | "feedback" | "finished" | "published";

export type ParsedStorySearch = {
  setId: number | null;
  setIndex: number | null;
  nameQuery: string;
  statusFilter: StorySearchState | null;
};

type StorySearchOptions = {
  enableStatusFilters?: boolean;
};

export function parseStorySearch(
  searchQuery: string,
  options?: StorySearchOptions,
): ParsedStorySearch | null {
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) return null;

  const enableStatusFilters = options?.enableStatusFilters === true;
  const statusTokensRemoved = enableStatusFilters
    ? splitStatusTokens(trimmedQuery)
    : { remainingQuery: trimmedQuery, statusFilter: null };
  const normalizedQuery = statusTokensRemoved.remainingQuery.trim();

  if (!normalizedQuery && statusTokensRemoved.statusFilter !== null) {
    return {
      setId: null,
      setIndex: null,
      nameQuery: "",
      statusFilter: statusTokensRemoved.statusFilter,
    };
  }

  const setPrefixMatch = normalizedQuery.match(/^(?<setId>\d+)\s*-\s*$/);

  if (setPrefixMatch?.groups) {
    return {
      setId: Number.parseInt(setPrefixMatch.groups.setId, 10),
      setIndex: null,
      nameQuery: "",
      statusFilter: statusTokensRemoved.statusFilter,
    };
  }

  const setAndIndexMatch = normalizedQuery.match(
    /^(?<setId>\d+)\s*-\s*(?<setIndex>\d+)(?:\s+(?<nameQuery>.+))?$/,
  );

  if (setAndIndexMatch?.groups) {
    return {
      setId: Number.parseInt(setAndIndexMatch.groups.setId, 10),
      setIndex: Number.parseInt(setAndIndexMatch.groups.setIndex, 10),
      nameQuery:
        setAndIndexMatch.groups.nameQuery?.trim().toLocaleLowerCase() ?? "",
      statusFilter: statusTokensRemoved.statusFilter,
    };
  }

  const setAndIndexWithSpaceMatch = normalizedQuery.match(
    /^(?<setId>\d+)\s+(?<setIndex>\d+)(?:\s+(?<nameQuery>.+))?$/,
  );

  if (setAndIndexWithSpaceMatch?.groups) {
    return {
      setId: Number.parseInt(setAndIndexWithSpaceMatch.groups.setId, 10),
      setIndex: Number.parseInt(setAndIndexWithSpaceMatch.groups.setIndex, 10),
      nameQuery:
        setAndIndexWithSpaceMatch.groups.nameQuery
          ?.trim()
          .toLocaleLowerCase() ?? "",
      statusFilter: statusTokensRemoved.statusFilter,
    };
  }

  const setAndNameMatch = normalizedQuery.match(
    /^(?<setId>\d+)(?:\s+(?<nameQuery>.+))$/,
  );

  if (setAndNameMatch?.groups) {
    return {
      setId: Number.parseInt(setAndNameMatch.groups.setId, 10),
      setIndex: null,
      nameQuery: setAndNameMatch.groups.nameQuery.trim().toLocaleLowerCase(),
      statusFilter: statusTokensRemoved.statusFilter,
    };
  }

  if (/^\d+$/.test(normalizedQuery)) {
    return {
      setId: Number.parseInt(normalizedQuery, 10),
      setIndex: null,
      nameQuery: "",
      statusFilter: statusTokensRemoved.statusFilter,
    };
  }

  return {
    setId: null,
    setIndex: null,
    nameQuery: normalizedQuery.toLocaleLowerCase(),
    statusFilter: statusTokensRemoved.statusFilter,
  };
}

export function matchesStorySearch(
  story: StorySearchable,
  searchQuery: ParsedStorySearch | string | null | undefined,
  options?: StorySearchOptions,
) {
  const parsedStorySearch =
    typeof searchQuery === "string"
      ? parseStorySearch(searchQuery, options)
      : searchQuery;

  if (parsedStorySearch === null || parsedStorySearch === undefined) {
    return true;
  }

  if (parsedStorySearch.statusFilter !== null) {
    const storyState = getStorySearchState(story);
    if (storyState !== parsedStorySearch.statusFilter) {
      return false;
    }
  }

  if (
    parsedStorySearch.setId !== null &&
    story.set_id !== parsedStorySearch.setId
  ) {
    return false;
  }

  if (
    parsedStorySearch.setIndex !== null &&
    story.set_index !== parsedStorySearch.setIndex
  ) {
    return false;
  }

  if (
    parsedStorySearch.nameQuery &&
    !story.name.toLocaleLowerCase().includes(parsedStorySearch.nameQuery)
  ) {
    return false;
  }

  return true;
}

export function formatStorySetLabel(
  story: Pick<StorySearchable, "set_id" | "set_index">,
) {
  return `${story.set_id} - ${story.set_index}`;
}

function splitStatusTokens(searchQuery: string): {
  remainingQuery: string;
  statusFilter: StorySearchState | null;
} {
  let statusFilter: StorySearchState | null = null;
  const remainingTokens: string[] = [];

  for (const token of searchQuery.split(/\s+/)) {
    const statusToken = normalizeStorySearchStateToken(token);
    if (statusToken !== null) {
      statusFilter = statusToken;
      continue;
    }
    remainingTokens.push(token);
  }

  return {
    remainingQuery: remainingTokens.join(" "),
    statusFilter,
  };
}

function normalizeStorySearchStateToken(
  token: string,
): StorySearchState | null {
  const normalizedToken = token.trim().toLocaleLowerCase();
  const rawStatus = normalizedToken.startsWith("status:")
    ? normalizedToken.slice("status:".length)
    : normalizedToken.startsWith("#")
      ? normalizedToken.slice(1)
      : normalizedToken;

  if (!rawStatus) return null;

  if (matchesStatusPrefix(rawStatus, ["d", "dr", "dra", "draf", "draft"])) {
    return "draft";
  }

  if (
    matchesStatusPrefix(rawStatus, [
      "f",
      "fe",
      "fee",
      "feed",
      "feedb",
      "feedba",
      "feedbac",
      "feedback",
    ])
  ) {
    return "feedback";
  }

  if (
    matchesStatusPrefix(rawStatus, [
      "fi",
      "fin",
      "fini",
      "finis",
      "finishe",
      "finished",
    ])
  ) {
    return "finished";
  }

  if (
    matchesStatusPrefix(rawStatus, [
      "p",
      "pu",
      "pub",
      "publ",
      "publi",
      "publis",
      "publish",
      "published",
      "public",
    ])
  ) {
    return "published";
  }

  return null;
}

function matchesStatusPrefix(rawStatus: string, acceptedValues: string[]) {
  return acceptedValues.includes(rawStatus);
}

function getStorySearchState(
  story: Pick<StorySearchable, "status" | "public">,
): StorySearchState | null {
  if (story.public || story.status === "published") return "published";
  if (story.status === "feedback") return "feedback";
  if (story.status === "finished") return "finished";
  if (story.status === "draft") return "draft";
  return null;
}
