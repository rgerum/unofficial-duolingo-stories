type SearchableEditorCourse = {
  id: number;
  short: string | null;
  from_language_name: string;
  from_language_short: string;
  learning_language_name: string;
  learning_language_short: string;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim();
}

export function filterEditorCourses<Course extends SearchableEditorCourse>(
  courses: Course[],
  query: string,
) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return courses;

  const queryTerms = normalizedQuery.split(/\s+/);
  return courses.filter((course) => {
    const searchableText = normalizeSearchText(
      [
        course.learning_language_name,
        course.learning_language_short,
        course.from_language_name,
        course.from_language_short,
        course.short ?? "",
      ].join(" "),
    );
    return queryTerms.every((term) => searchableText.includes(term));
  });
}

export function sortEditorCoursesByPin<Course extends { id: number }>(
  courses: Course[],
  pinnedCourseIds: number[],
) {
  const pinnedCourseIdSet = new Set(pinnedCourseIds);
  return courses
    .map((course, originalIndex) => ({ course, originalIndex }))
    .sort(
      (a, b) =>
        Number(pinnedCourseIdSet.has(b.course.id)) -
          Number(pinnedCourseIdSet.has(a.course.id)) ||
        a.originalIndex - b.originalIndex,
    )
    .map(({ course }) => course);
}
