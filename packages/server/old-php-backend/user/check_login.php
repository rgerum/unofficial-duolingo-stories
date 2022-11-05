<?php
session_start();
include("../functions_new.php");

if(!isset($_SESSION["user"]) || $_SESSION["user"]["role"] == 0) {
    http_response_code(403);
}
else
    echo $_SESSION["user"]["username"];