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
SELECT story.id, story.image, story.image_done, story.name, story.xp, name_base, MAX(story_done.time) as time FROM story
LEFT JOIN story_done ON story_done.story_id = story.id AND story_done.user_id = $user 
JOIN language l1 ON story.lang = l1.id AND l1.short = $lang
JOIN language l2 ON story.lang_base = l2.id AND l2.short = $lang_base
WHERE story.public = 1
GROUP BY story.id";

    queryDatabase($query);
}
