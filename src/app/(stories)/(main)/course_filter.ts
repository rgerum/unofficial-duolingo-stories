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
  const queryTerms = normalizedQuery.split(/\s+/);

  return groups.flatMap((group) => {
    const courses = group.courses.filter((course) => {
      const searchableText = normalizeSearchText(
        `${course.name} ${course.short} ${group.fromLanguageName}`,
      );
      return queryTerms.every((term) => searchableText.includes(term));
    });

    return courses.length > 0 ? [{ ...group, courses }] : [];
  });
}
