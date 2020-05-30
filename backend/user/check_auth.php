<?php
session_start();
include("../functions_new.php");
include("hash_functions.php");
print_r($_SESSION);
echo "<br/>";

$db = database();
$username = mysqli_escape_string($db, $_REQUEST["username"]);
$password = $_REQUEST["password"];
$query = "SELECT * FROM user WHERE username = '$username' AND activated = 1";
$result = mysqli_query($db, $query);
$user = mysqli_fetch_assoc($result);
$hash = $user["password"];

if(phpbb_check_hash($password, $hash)) {
	$_SESSION["user"] = $user;
    print_r($_SESSION);
    http_response_code(200);
}
else
    http_response_code(403);
