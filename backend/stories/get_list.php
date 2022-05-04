<?php
session_start();
include('../functions_new.php');

if(isset($_GET['lang']) && isset($_GET['lang_base'])) {
    $db = database();
    $lang = sqlSafeString($_GET['lang']);
    $lang_base = sqlSafeString($_GET['lang_base']);
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
        JOIN language l2 ON c.fromLanguage = l2.id AND l2.short = $lang_base)
    GROUP BY story.id
    ORDER BY set_id, set_index;";

    queryDatabase($query);
}
