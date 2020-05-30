<?php
session_start();
include("../functions_new.php");

if(!isset($_SESSION["user"])) {
    http_response_code(403);
}
else
    echo "{\"username\": \"".$_SESSION["user"]["username"]."\", \"role\": ".$_SESSION["user"]["role"]."}";