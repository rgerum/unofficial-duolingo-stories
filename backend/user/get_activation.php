<?php
session_start();
include("../functions_new.php");
include("hash_functions.php");

$db = database();
$username = mysqli_escape_string($db, $_REQUEST["username"]);
$activation_link = mysqli_escape_string($db, $_REQUEST["activation_link"]);

$result = mysqli_query($db,
"UPDATE user SET activated = 1 WHERE username = '$username' AND activation_link = '$activation_link';");

if(0)
    http_response_code(403);
else
    echo $_REQUEST["username"];
