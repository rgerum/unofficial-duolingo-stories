import assert from "node:assert/strict";
import test from "node:test";
import {
  filterEditorCourses,
  sortEditorCoursesByPin,
} from "./course_list_state";

const courses = [
  {
    id: 1,
    short: "es-en",
    learning_language_name: "Español",
    learning_language_short: "es",
    from_language_name: "English",
    from_language_short: "en",
  },
  {
    id: 2,
    short: "de-fr",
    learning_language_name: "Allemand",
    learning_language_short: "de",
    from_language_name: "Français",
    from_language_short: "fr",
  },
  {
    id: 3,
    short: "fr-en",
    learning_language_name: "French",
    learning_language_short: "fr",
    from_language_name: "English",
    from_language_short: "en",
  },
];

test("filters editor courses by names, codes, and combined terms", () => {
  assert.deepEqual(
    filterEditorCourses(courses, "ESPANOL").map((course) => course.id),
    [1],
  );
  assert.deepEqual(
    filterEditorCourses(courses, "francais").map((course) => course.id),
    [2],
  );
  assert.deepEqual(
    filterEditorCourses(courses, "French English").map((course) => course.id),
    [3],
  );
  assert.deepEqual(
    filterEditorCourses(courses, "de-fr").map((course) => course.id),
    [2],
  );
});

test("keeps source ordering inside pinned and unpinned groups", () => {
  assert.deepEqual(
    sortEditorCoursesByPin(courses, [3, 1]).map((course) => course.id),
    [1, 3, 2],
  );
  assert.deepEqual(
    sortEditorCoursesByPin(courses, []).map((course) => course.id),
    [1, 2, 3],
  );
});
