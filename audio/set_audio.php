<?php
session_start();
include('../backend/functions_new.php');

if(!isset($_SESSION["user"]) || $_SESSION["user"]["role"] == 0) {
    http_response_code(403);
    die();
}

$id = sqlSafeInt($_POST["id"]);
$line_id = sqlSafeInt($_POST["line_id"]);
$json = $_POST["json"];

file_put_contents("story$id.json", $json);

set_time_limit (60);
echo "execute";

exec("python3 story_to_audio.py $id $line_id 2>&1", $out, $retval);
var_dump($out);
var_dump($retval);