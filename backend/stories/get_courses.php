<?php
session_start();
include('../functions_new.php');

$query = "
SELECT course.id, l1.short AS fromLanguage, l1.name AS fromLanguageName, l2.short AS learningLanguage, l2.name AS learningLanguageName, COUNT(story.id) count, course.public, course.official FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
LEFT JOIN story ON (story.lang = course.learningLanguage AND story.lang_base = course.fromLanguage)
GROUP BY course.id
ORDER BY COUNT DESC;
";

queryDatabase($query);

