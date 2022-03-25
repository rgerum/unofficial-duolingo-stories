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

#print($_POST["text"]);
#print("\n");
function uuidv4($data = null) {
    // Generate 16 bytes (128 bits) of random data or use the data passed into the function.
    $data = $data ?? random_bytes(16);
    assert(strlen($data) == 16);

    // Set version to 0100
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    // Set bits 6-7 to 10
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

    // Output the 36 character UUID.
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}


set_time_limit (60);
#echo "execute";
#echo $text;
#echo "python3 story_to_audio_new.py $id \"$speaker\" \"$text\" 2>&1";
#print("python3 story_to_audio_new.py $id \"$speaker\" \"$text\" 2>&1");
#print("\n");
$filename = uuidv4();
$filename = "tmp_$filename.txt";
file_put_contents($filename, $text);
#exec("python3 story_to_audio_new.py $id \"$speaker\" \"$text\" 2>&1", $out, $retval);
exec("python3 story_to_audio_new.py $id \"$speaker\" $filename 2>&1", $out, $retval);
if($retval == 0)
    echo end($out);
else {
    var_dump($out);
    var_dump($retval);
}