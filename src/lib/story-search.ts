export type StorySearchable = {
  name: string;
  set_id: number;
  set_index: number;
};

export type ParsedStorySearch = {
  setId: number | null;
  setIndex: number | null;
  nameQuery: string;
};

export function parseStorySearch(
  searchQuery: string,
): ParsedStorySearch | null {
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) return null;

  const setPrefixMatch = trimmedQuery.match(/^(?<setId>\d+)\s*-\s*$/);

  if (setPrefixMatch?.groups) {
    return {
      setId: Number.parseInt(setPrefixMatch.groups.setId, 10),
      setIndex: null,
      nameQuery: "",
    };
  }

  const setAndIndexMatch = trimmedQuery.match(
    /^(?<setId>\d+)\s*-\s*(?<setIndex>\d+)(?:\s+(?<nameQuery>.+))?$/,
  );

  if (setAndIndexMatch?.groups) {
    return {
      setId: Number.parseInt(setAndIndexMatch.groups.setId, 10),
      setIndex: Number.parseInt(setAndIndexMatch.groups.setIndex, 10),
      nameQuery:
        setAndIndexMatch.groups.nameQuery?.trim().toLocaleLowerCase() ?? "",
    };
  }

  const setAndIndexWithSpaceMatch = trimmedQuery.match(
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
    };
  }

  const setAndNameMatch = trimmedQuery.match(
    /^(?<setId>\d+)(?:\s+(?<nameQuery>.+))$/,
  );

  if (setAndNameMatch?.groups) {
    return {
      setId: Number.parseInt(setAndNameMatch.groups.setId, 10),
      setIndex: null,
      nameQuery: setAndNameMatch.groups.nameQuery.trim().toLocaleLowerCase(),
    };
  }

  if (/^\d+$/.test(trimmedQuery)) {
    return {
      setId: Number.parseInt(trimmedQuery, 10),
      setIndex: null,
      nameQuery: "",
    };
  }

  return {
    setId: null,
    setIndex: null,
    nameQuery: trimmedQuery.toLocaleLowerCase(),
  };
}

export function matchesStorySearch(
  story: StorySearchable,
  searchQuery: ParsedStorySearch | string | null | undefined,
) {
  const parsedStorySearch =
    typeof searchQuery === "string"
      ? parseStorySearch(searchQuery)
      : searchQuery;

  if (parsedStorySearch === null || parsedStorySearch === undefined) {
    return true;
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
