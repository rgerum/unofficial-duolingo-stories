<?php
include('../functions_new.php');
header('Content-Type: application/json');

if(isset($_GET['lang'])) {
    $db = database();
    $id = sqlSafeString($_GET['lang']);
    $query = "SELECT content FROM lexicon WHERE lexicon.language_id = (SELECT id FROM language WHERE short = $id) LIMIT 1;";

    $row = getQuery($query, true);

    print($row["content"]);
}