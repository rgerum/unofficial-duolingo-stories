<?php
header('Access-Control-Allow-Origin: *');

header('Access-Control-Allow-Methods: GET, POST');

header("Access-Control-Allow-Headers: X-Requested-With");

include('../functions_new.php');

if(isset($_GET['id'])) {
    $db = database();
    $id = sqlSafeInt($_GET['id']);
    $query = "SELECT * FROM story WHERE id = $id;";
    queryDatabase($query);
}
