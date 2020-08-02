<?php
include('../functions_new.php');
header('Content-Type: application/json');

if(isset($_GET['id'])) {
    $db = database();
    $id = sqlSafeInt($_GET['id']);
    $query = "SELECT story.json FROM story WHERE story.id = $id;";

    $row = getQuery($query, true);

    print($row["json"]);
}
