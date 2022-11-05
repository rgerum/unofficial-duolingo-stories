<?php
session_start();
/*
Endpoint:

action: ["register", "send", "check", "set", "logout"]
username: the username
password: the new password (for "set" action)
uuid: the uuid (for "check" and "set")
*/
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

include ( '../functions_new.php' );


function get_values($names) {
    global $db;
    $output = [];
    foreach ($names as $name) {
        if(!$_REQUEST[$name])
            echo "ERROR: $name not provided.\n";
        if($name == "password")
            $output[] = mysqli_escape_string($db, phpbb_hash($_REQUEST["password"]));
        $output[] = mysqli_escape_string($db, $_REQUEST[$name]);
    }
    return $output;
}

$db = database();

$action = $_REQUEST['action'];

if($action == "avatar") {
    echo "avatar\n";
    list($id, $link) = get_values(['id', 'link']);
    $result = mysqli_query($db,"INSERT INTO avatar (id, link) VALUES($id, \"$link\")");
}
else if($action == "image") {
    echo "image\n";
    list($id, $active, $gilded, $locked, $activeLip, $gildedLip) = get_values(['id', 'active', 'gilded', 'locked', 'activeLip', 'gildedLip']);
    $query = "INSERT INTO image (id, active, gilded, locked, activeLip, gildedLip) VALUES(\"$id\", \"$active\", \"$gilded\", \"$locked\", \"$activeLip\", \"$gildedLip\")";
    $result = mysqli_query($db,$query);
    echo $query;
}
else {
    echo "unknown action";
}
