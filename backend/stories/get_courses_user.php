<?php
session_start();
include('../functions_new.php');

if(isset($_SESSION["user"])) {
    $user = $_SESSION["user"]["id"];
}
else
    $user = "NULL";

$query = "
SELECT course.id, course.name,
 l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
 l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
 course.public, course.official, time FROM course
LEFT JOIN language l1 ON l1.id = course.fromLanguage
LEFT JOIN language l2 ON l2.id = course.learningLanguage
    INNER JOIN (SELECT s.course_id, story_done.id as sdid, MAX(story_done.time) as time FROM story s INNER JOIN story_done ON story_done.story_id = s.id WHERE story_done.user_id = $user GROUP BY course_id) as ss on course.id = ss.course_id

         ORDER BY time DESC
";

queryDatabase($query);

