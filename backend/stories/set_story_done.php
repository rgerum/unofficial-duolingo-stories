<?php
session_start();
include('../functions_new.php');

echo isset($_GET['id']);
echo isset($_SESSION["user"]);
if(isset($_GET['id'])) {
    $db = database();
    $story_id = sqlSafeInt($_GET['id']);
    if(isset($_SESSION["user"]))
        $user_id = $_SESSION["user"]['id'];
    else
        $user_id = "NULL";
    
    $query = "INSERT INTO story_done (user_id, story_id) VALUES($user_id, $story_id)";
    echo $query;
    $result = mysqli_query($db, $query);
}
