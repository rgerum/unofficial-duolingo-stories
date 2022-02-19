<?php
session_start();
include('../backend/functions_new.php');

if(!isset($_SESSION["user"]) || $_SESSION["user"]["role"] == 0) {
    http_response_code(403);
    die();
}

$id = sqlSafeInt($_POST["id"]);
$speaker = $_POST["speaker"];
$text = $_POST["text"];

set_time_limit (60);
#echo "execute";
#echo $text;
#echo "python3 story_to_audio_new.py $id \"$speaker\" \"$text\" 2>&1";
exec("python3 story_to_audio_new.py $id \"$speaker\" \"$text\" 2>&1", $out, $retval);
if($retval == 0)
    echo end($out);
else {
    var_dump($out);
    var_dump($retval);
}