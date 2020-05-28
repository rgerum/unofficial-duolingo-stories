<?php
include('../functions_new.php');

if(isset($_GET['id'])) {
    $db = database();
    $id = sqlSafeInt($_GET['id']);
    $query = "SELECT * FROM story WHERE id = $id;";
    queryDatabase($query);
}
