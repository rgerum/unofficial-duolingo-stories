<?php
session_start();
include('../functions_new.php');

if(!isset($_SESSION["user"]) || $_SESSION["user"]["admin"] == 0) {
    http_response_code(403);
    die();
}

$db = database();
$lang = sqlSafeString($_GET['lang']);
$lang_base = sqlSafeString($_GET['lang_base']);
$query = "
SELECT user.id, user.username, user.role, user.email, user.regdate, user.activated, user.admin, COUNT(story.id) count FROM user LEFT JOIN story ON story.author = user.id GROUP BY user.id
";

queryDatabase($query);
