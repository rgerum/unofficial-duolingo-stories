<?php
session_start();
include('../functions_new.php');

if(!isset($_SESSION["user"]) || $_SESSION["user"]["admin"] == 0) {
    http_response_code(403);
    die();
}

$user_id = sqlSafeInt($_GET['id']);
$activated = sqlSafeInt($_GET['activated']);

$db = database();

$query = "UPDATE user SET activated = $activated WHERE user.id = $user_id;";
//echo $query;
mysqli_query($db, $query);

echo mysqli_affected_rows($db);
