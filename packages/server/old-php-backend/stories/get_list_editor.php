<?php
session_start();
include('../functions_new.php');

if(isset($_GET['lang']) && isset($_GET['lang_base'])) {
    $db = database();
    $lang = sqlSafeString($_GET['lang']);
    $lang_base = sqlSafeString($_GET['lang_base']);
    $query = "
SELECT story.id, story.set_id, story.set_index, story.name, story.image, story.image_done, story.xp, story.name_base, COUNT(done.id) count, user.username, story.date, story.change_date, story.public FROM story
LEFT JOIN user ON story.author = user.id
LEFT JOIN story_done done ON story.id = done.story_id
JOIN language l1 ON story.lang = l1.id AND l1.short = $lang
JOIN language l2 ON story.lang_base = l2.id AND l2.short = $lang_base
GROUP BY story.id
";

    queryDatabase($query);
}
