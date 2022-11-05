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
    "image" => "string",
    "image_done" => "string",
    "image_locked" => "string",
    "discussion" => "string",
    "xp" => "int",
    "duo_id" => "string",
    "cefr" => "string",
    "set_id" => "int",
    "set_index" => "int",
    "text" => "string",
    "json" => "string"];

if($_POST["id"] == "")
    $_POST["author"] = $_SESSION["user"]["id"];

$id = updateDatabase($keys, "story", $_POST, "id");

$query = "SELECT * FROM story WHERE id = $id LIMIT 1;";

queryDatabase($query);
