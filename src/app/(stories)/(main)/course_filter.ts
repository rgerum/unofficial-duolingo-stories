interface SearchableCourse {
  name: string;
  short: string;
}

interface SearchableCourseGroup<Course extends SearchableCourse> {
  fromLanguageName: string;
  courses: Course[];
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim();
}

export function filterCourseGroups<
  Course extends SearchableCourse,
  Group extends SearchableCourseGroup<Course>,
>(groups: Group[], query: string): Group[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return groups;

  return groups.flatMap((group) => {
    const sourceLanguageMatches = normalizeSearchText(
      group.fromLanguageName,
    ).includes(normalizedQuery);
    const courses = sourceLanguageMatches
      ? group.courses
      : group.courses.filter((course) =>
          normalizeSearchText(`${course.name} ${course.short}`).includes(
            normalizedQuery,
          ),
        );

    return courses.length > 0 ? [{ ...group, courses }] : [];
  });
}
