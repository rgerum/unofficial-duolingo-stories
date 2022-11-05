<?php
session_start();
include('../functions_new.php');

if(!isset($_SESSION["user"]) || $_SESSION["user"]["role"] == 0) {
    http_response_code(403);
    die();
}

$story_id = sqlSafeInt($_GET['id']);
$public = sqlSafeInt($_GET['public']);

$db = database();

$query = "UPDATE story SET public = $public WHERE story.id = $story_id;";
//echo $query;
mysqli_query($db, $query);

echo mysqli_affected_rows($db);
