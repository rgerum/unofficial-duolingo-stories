<?php
session_start();
include('../functions_new.php');

$query = "
SELECT story.id, story.duo_id FROM story
WHERE story.author = 1
";

queryDatabase($query);
