<?php
include('../functions_new.php');

if(isset($_GET['id'])) {
    $db = database();
    $id = sqlSafeInt($_GET['id']);
    $query = "SELECT story.id, story.text, story.xp, story.discussion, story.image, story.image_done, story.author, (SELECT rtl FROM language WHERE story.lang = language.id) rtl, (SELECT short FROM language WHERE story.lang = language.id) lang, (SELECT short FROM language WHERE story.lang_base = language.id) lang_base, language.name language FROM story LEFT JOIN language ON language.id = story.lang WHERE story.id = $id;";
    queryDatabase($query);
}
