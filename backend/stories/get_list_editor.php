<?php
session_start();
include('../functions_new.php');

if(isset($_GET['lang']) && isset($_GET['lang_base'])) {
    $db = database();
    $lang = sqlSafeString($_GET['lang']);
    $lang_base = sqlSafeString($_GET['lang_base']);
    $query = "
SELECT story.id, story.name, story.xp, name_base, user.username, story.date, story.change_date FROM story 
LEFT JOIN user ON story.author = user.id
JOIN language l1 ON story.lang = l1.id AND l1.short = $lang
JOIN language l2 ON story.lang_base = l2.id AND l2.short = $lang_base
GROUP BY story.id
";

    queryDatabase($query);
}
