<?php
session_start();
include('../functions_new.php');

echo isset($_GET['id']);
echo isset($_SESSION["user"]);
if(isset($_GET['id']) && isset($_SESSION["user"])) {
    $db = database();
    $story_id = sqlSafeInt($_GET['id']);
    $user_id = $_SESSION["user"]['id'];
    
    $query = "INSERT INTO story_done (user_id, story_id) VALUES($user_id, $story_id)";
    echo $query;
    $result = mysqli_query($db, $query);
}
