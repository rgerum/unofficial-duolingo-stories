<?php
session_start();
include('../functions_new.php');

$query = "SELECT * FROM language";

queryDatabase($query);

