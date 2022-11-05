<?php
session_start();
include('../functions_new.php');


function query_json_list_return($db, $query) {
    $result = mysqli_query($db, $query);
    $rows = [];
    while($r = mysqli_fetch_assoc($result)) {
        $rows[] = $r;
    }
    return $rows;
}

function json($data) {
    print(json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_NUMERIC_CHECK));
}

if(isset($_GET['lang']) && isset($_GET['lang_base'])) {
    $db = database();
    $lang = sqlSafeString($_GET['lang']);
    $lang_base = sqlSafeString($_GET['lang_base']);

    $course = query_json_list_return($db,
        "SELECT course.id, course.name, course.fromLanguage as fromLanguageID, l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
                                        course.learningLanguage as learningLanguageID, l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
                                  course.public, course.official, course.about FROM course
        LEFT JOIN language l1 ON l1.id = course.fromLanguage
        LEFT JOIN language l2 ON l2.id = course.learningLanguage
        WHERE course.id = (SELECT c.id FROM course c
                      JOIN language l1 ON c.learningLanguage = l1.id AND l1.short = $lang
                      JOIN language l2 ON c.fromLanguage = l2.id AND l2.short = $lang_base WHERE c.official = 0);");
    if(isset($course[0]))
       $course = $course[0];

    if(isset($_SESSION["user"])) {
        $user = $_SESSION["user"]["id"];
    }
    else
        $user = "NULL";

    $query = "
    SELECT story.id, story.set_id, story.set_index, story.name, MAX(story_done.time) as time,
    i.active, i.activeLip, i.gilded, i.gildedLip
    FROM story
    LEFT JOIN story_done ON story_done.story_id = story.id AND story_done.user_id = $user
    JOIN image i on story.image = i.id
    WHERE story.public = 1 and story.course_id = (SELECT c.id FROM course c
        JOIN language l1 ON c.learningLanguage = l1.id AND l1.short = $lang
        JOIN language l2 ON c.fromLanguage = l2.id AND l2.short = $lang_base WHERE c.official = 0)
    GROUP BY story.id
    ORDER BY set_id, set_index;";

    $stories = query_json_list_return($db, $query);

    $course["stories"] = $stories;
    json($course);
}
