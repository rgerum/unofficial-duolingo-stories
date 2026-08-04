import assert from "node:assert/strict";
import test from "node:test";
import { filterCourseGroups } from "./course_filter";

const groups = [
  {
    fromLanguageId: "english",
    fromLanguageName: "English",
    labels: { storiesFor: "Stories for", nStoriesTemplate: "$count stories" },
    courses: [
      { id: 1, short: "es-en", name: "Español", count: 10 },
      { id: 2, short: "fr-en", name: "French", count: 8 },
    ],
  },
  {
    fromLanguageId: "francais",
    fromLanguageName: "Français",
    labels: {
      storiesFor: "Histoires pour",
      nStoriesTemplate: "$count histoires",
    },
    courses: [{ id: 3, short: "de-fr", name: "Allemand", count: 5 }],
  },
];

test("returns every group for a blank query", () => {
  assert.equal(filterCourseGroups(groups, "   "), groups);
});

test("matches course names without case or accents", () => {
  const result = filterCourseGroups(groups, "ESPANOL");

  assert.deepEqual(
    result.map((group) => group.courses.map((course) => course.name)),
    [["Español"]],
  );
});

test("matches course codes and source-language names", () => {
  assert.deepEqual(
    filterCourseGroups(groups, "de-fr").flatMap((group) => group.courses),
    [groups[1].courses[0]],
  );
  assert.deepEqual(
    filterCourseGroups(groups, "francais").flatMap((group) => group.courses),
    groups[1].courses,
  );
});

test("matches queries that combine course and source-language names", () => {
  assert.deepEqual(
    filterCourseGroups(groups, "French English").flatMap(
      (group) => group.courses,
    ),
    [groups[0].courses[1]],
  );
});

test("removes groups with no matching courses", () => {
  assert.deepEqual(filterCourseGroups(groups, "Klingon"), []);
});
