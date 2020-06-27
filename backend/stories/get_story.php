<?php
include('../functions_new.php');

if(isset($_GET['id'])) {
    $db = database();
    $id = sqlSafeInt($_GET['id']);
    $query = "SELECT story.id, story.text, story.xp, language.name language FROM story JOIN language ON language.id = story.lang WHERE story.id = $id;";
    queryDatabase($query);
}
