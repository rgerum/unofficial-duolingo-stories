<?php
session_start();
include('../functions_new.php');

if(!isset($_SESSION["user"]) || $_SESSION["user"]["role"] == 0) {
    http_response_code(403);
    die();
}


$keys = ["id" => "int",
    "name" => "string",
    "name_base" => "string",
    "lang" => "string",
    "lang_base" => "string",
    "author" => "int",
    "change_date" => "string",
    "text" => "string"];

$_POST["author"] = $_SESSION["user"];

$id = updateDatabase($keys, "story", $_POST, "id");

$query = "SELECT * FROM story WHERE id = $id LIMIT 1;";

queryDatabase($query);
