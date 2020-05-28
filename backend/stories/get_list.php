<?php
include('../functions_new.php');

if(isset($_GET['lang']) && isset($_GET['lang_base'])) {
    $db = database();
    $lang = sqlSafeString($_GET['lang']);
    $lang_base = sqlSafeString($_GET['lang_base']);
    $query = "SELECT story.id, story.name, name_base FROM story JOIN language l1 ON lang = l1.id JOIN language l2 ON lang_base = l2.id WHERE l1.short = $lang AND l2.short = $lang_base;";
    queryDatabase($query);
}
